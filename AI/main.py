# Import required modules
from fastapi import FastAPI, BackgroundTasks  # Web framework and background task handling
from pydantic import BaseModel  # Data validation using Python type annotations
from typing import List, Optional  # Type hints for function signatures
import pandas as pd  # Data manipulation and analysis
from sklearn.feature_extraction.text import TfidfVectorizer  # Convert text to TF-IDF features
from sklearn.metrics.pairwise import cosine_similarity  # Calculate cosine similarity between vectors. Matches items
import requests  # HTTP library for making requests to the main backend
from database import get_active_listings  # Custom function to get active listings from database
from chatbot_service import get_chatbot  # Custom function to get chatbot instance
from dotenv import load_dotenv  # Load environment variables from .env file
import os  # Operating system interface

# Load .env file with debugging
print("Loading .env file...")
load_dotenv()
print(f"Current directory: {os.getcwd()}")
print(f"Files in directory: {os.listdir('.')}")

# Check if .env exists
if os.path.exists('.env'):
    print(".env file exists!")
    # Read and check the content (doesn't print actual key). Add print if i want to see key
    with open('.env', 'r') as f:
        env_content = f.read()
        print(f".env content (redacted): {env_content.replace('OPENAI_API_KEY=', 'OPENAI_API_KEY=***')}")
else:
    print(".env file does NOT exist!")

# Check if API key is loaded. Testing purposes
openai_api_key = os.getenv("OPENAI_API_KEY")
print(f"API Key loaded: {bool(openai_api_key)}")
print(f"API Key length: {len(openai_api_key) if openai_api_key else 0}")

# Create FastAPI application instance
app = FastAPI(title="FindersNotKeepers AI Service")
MAIN_BACKEND_URL = "http://localhost:3000"  # URL of the main backend service

# Define data models using Pydantic for request/response validation
class ItemListing(BaseModel):
    itemID: int
    userID: int
    title: str
    description: str
    category: str
    type: str  # "lost" or "found"
    location: str
    dateLostFound: str
    status: str

class MatchRequest(BaseModel):
    newListing: ItemListing  # The new listing to match against existing ones

class MatchResult(BaseModel):
    matchedListingId: int  # ID of the matched listing
    similarityScore: float  # Similarity score (0-1)
    matchedOn: List[str]  # List of features that contributed to the match

class MatchResponse(BaseModel):
    triggerListingId: int  # ID of the listing that triggered the matching
    triggerType: str  # Type of the trigger listing ("lost" or "found")
    matches: List[MatchResult]  # List of match results

class ChatMessage(BaseModel):
    message: str  # User's message to the chatbot
    session_id: Optional[str] = None  # Helps with knowing what is being chatted. Optional session ID for conversation tracking

class ChatResponse(BaseModel):
    response: str  # Chatbot's response
    session_id: str  # Session ID for conversation tracking
    suggested_questions: List[str]  # Suggested follow-up questions

# Function to send match notifications to the main backend for now, not sure if i should be sending to network or backend.
async def send_match_notification(match_response: MatchResponse):
    try:
        response = requests.post(
            f"{MAIN_BACKEND_URL}/api/notifications/matches",
            json=match_response.dict()  # Convert Pydantic model to dictionary
        )
        print(f"Match notification sent: {response.status_code}")
    except Exception as e:
        print(f"Failed to send match notification: {e}")

# Function to calculate text similarity between items
def calculate_similarity(new_item, target_items):
    if target_items.empty:
        return []  # Return empty list if no target items

    # Create text corpus from target items
    corpus_target = [
        f"{row['title']} {row['description']} {row['location']} {row['category']}"
        for _, row in target_items.iterrows()
    ]
    # Create text corpus from new item
    corpus_new = [f"{new_item.title} {new_item.description} {new_item.location} {new_item.category}"]

    # Create TF-IDF vectorizer with English stop words removed. (TF-IDF = term frequency-inverse document frequency)
    vectorizer = TfidfVectorizer(stop_words='english')
    # Fit and transform the corpus
    tfidf_matrix = vectorizer.fit_transform(corpus_target + corpus_new)

    # Get the vector for the new item (last in the matrix)
    new_vec = tfidf_matrix[-1]
    # Get vectors for target items (all except the last)
    target_vecs = tfidf_matrix[:-1]
    # Calculate cosine similarity between new item and all target items
    similarity_scores = cosine_similarity(new_vec, target_vecs).flatten()

    return similarity_scores    # I might change this into a percentage

# Background task to process matching for a new listing
async def process_matching(new_listing: ItemListing):
    print(f"Processing matching for new {new_listing.type} item: {new_listing.title}")

    # Determine target type (look for lost items if new item is found, and vice versa)
    target_type = "lost" if new_listing.type == "found" else "found"
    # Get active listings of the target type from database
    target_listings = get_active_listings(target_type)

    if target_listings.empty:
        print("No target listings found for matching")
        return

    # Calculate similarity scores between new item and target items
    similarity_scores = calculate_similarity(new_listing, target_listings)
    matches = []

    # Create match results for scores above threshold (0.3)
    for idx, score in enumerate(similarity_scores):
        if score > 0.3:
            target_item = target_listings.iloc[idx]
            matches.append(MatchResult(
                matchedListingId=int(target_item['itemID']),
                similarityScore=round(float(score), 2),
                matchedOn=["text_similarity"]
            ))

    # Sort matches by similarity score (highest first)
    matches.sort(key=lambda x: x.similarityScore, reverse=True)
    # Get top 3 matches
    top_matches = matches[:3]
    # Decide later whether I want to increase the threshold then show all listings
    # Might be a bother getting a lot of notifications

    # If matches found, send notification
    if top_matches:
        match_response = MatchResponse(
            triggerListingId=new_listing.itemID,
            triggerType=new_listing.type,
            matches=top_matches
        )
        await send_match_notification(match_response)
        print(f"Found {len(top_matches)} matches for item {new_listing.itemID}")

# API endpoint to trigger matching process
@app.post("/api/ai/match")
async def find_matches(request: MatchRequest, background_tasks: BackgroundTasks):
    # Add matching process as a background task
    background_tasks.add_task(process_matching, request.newListing)
    return {"status": "accepted", "message": "Matching process started"}

# API endpoint for chatbot interaction
@app.post("/api/ai/chat", response_model=ChatResponse)
async def chat_with_bot(chat_message: ChatMessage):
    try:
        # Get chatbot instance
        chatbot = get_chatbot()
        # Get response from chatbot
        response = chatbot.get_response(chat_message.message)

        # Return formatted response
        return ChatResponse(
            response=response,
            session_id=chat_message.session_id or "default",
            suggested_questions=[
                "How do I report a lost item?",
                "How does matching work?",
                "How do I claim an item?",
                "Is my information secure?"
            ]
        )
    except Exception as e:
        print(f"Chatbot error: {str(e)}")
        # Return error response if chatbot fails
        return ChatResponse(
            response="Sorry, I'm having trouble connecting. Please try again later.",
            session_id=chat_message.session_id or "default",
            suggested_questions=[]
        )

# Application entry point
if __name__ == "__main__":
    import uvicorn  # ASGI server for running FastAPI application
    # Run the FastAPI application
    uvicorn.run(app, host="0.0.0.0", port=8000)

'''
Use this when I'm able to use api key 
@app.post("/api/ai/chat", response_model=ChatResponse)
async def chat_with_bot(chat_message: ChatMessage):
    try:
        openai_api_key = os.getenv("OPENAI_API_KEY")
        print(f"API Key in endpoint: {bool(openai_api_key)}")

        if not openai_api_key:
            print("ERROR: No OpenAI API key found!")
            return ChatResponse(
                response="Chatbot service not configured. Please contact support.",
                session_id=chat_message.session_id or "default",
                suggested_questions=[]
            )

        print("Creating chatbot instance...")
        chatbot = get_chatbot(openai_api_key)
        print("Getting response from chatbot...")
        response = chatbot.get_response(chat_message.message)
        print(f"Chatbot response: {response}")

        return ChatResponse(
            response=response,
            session_id=chat_message.session_id or "default",
            suggested_questions=[
                "How do I report a lost item?",
                "How does matching work?",
                "How do I claim an item?",
                "Is my information secure?"
            ]
        )
    except Exception as e:
        print(f"Chatbot error: {str(e)}")
        import traceback
        traceback.print_exc()  # This will show the full error traceback
        return ChatResponse(
            response="Sorry, I'm having trouble connecting. Please try again later.",
            session_id=chat_message.session_id or "default",
            suggested_questions=[]
        )


@app.get("/api/ai/health")
async def health_check():
    return {"status": "healthy", "service": "ai-matching"}


@app.get("/api/ai/stats")
async def get_stats():
    lost_items = get_active_listings("lost")
    found_items = get_active_listings("found")
    return {
        "active_lost_items": len(lost_items),
        "active_found_items": len(found_items),
        "total_active_items": len(lost_items) + len(found_items)
    }
'''
