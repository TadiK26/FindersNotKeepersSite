"""
AI Services for FindersNotKeepers
Handles semantic matching, chatbot responses, and AI features
"""

import openai
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import json
from datetime import datetime

# Initialize OpenAI (would use actual API key in production)
# openai.api_key = os.getenv('OPENAI_API_KEY')

# Knowledge base for chatbot
CHATBOT_KNOWLEDGE_BASE = {
    "greetings": [
        "hello", "hi", "hey", "good morning", "good afternoon", "good evening"
    ],
    "farewells": [
        "bye", "goodbye", "see you", "later"
    ],
    "help_topics": {
        "report_lost": "To report a lost item, go to the homepage and click 'Report Lost Item'. Fill in the details about your item including description, location, and date.",
        "report_found": "To report a found item, go to the homepage and click 'Report Found Item'. Provide as much detail as possible to help identify the owner.",
        "search_items": "You can search for items using keywords, categories, or location filters. Use the search page for advanced filtering options.",
        "ai_matching": "Our AI automatically matches lost and found items based on semantic similarity of descriptions, titles, and other attributes.",
        "notifications": "You'll receive notifications when potential matches are found or when someone claims your item.",
        "claim_process": "To claim an item, you need to provide proof of ownership. This helps ensure items are returned to their rightful owners.",
        "account_management": "You can update your profile, notification preferences, and search settings in your account settings."
    }
}

# Track unanswered questions for improvement
unanswered_questions = []

def calculate_semantic_similarity(listing1, listing2):
    """
    Calculate semantic similarity between two listings using TF-IDF and cosine similarity

    Args:
        listing1 (dict): First listing data
        listing2 (dict): Second listing data

    Returns:
        float: Similarity score between 0 and 1
    """
    try:
        # Combine title and description for better semantic understanding
        text1 = f"{listing1['title']} {listing1['description']} {listing1['category']}"
        text2 = f"{listing2['title']} {listing2['description']} {listing2['category']}"

        # Create TF-IDF vectorizer
        vectorizer = TfidfVectorizer(stop_words='english')

        # Fit and transform the texts
        tfidf_matrix = vectorizer.fit_transform([text1, text2])

        # Calculate cosine similarity
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]

        return float(similarity)

    except Exception as e:
        print(f"Error calculating semantic similarity: {e}")
        # Fallback to simple word overlap
        return calculate_basic_similarity(listing1, listing2)

def calculate_basic_similarity(listing1, listing2):
    """
    Fallback similarity calculation using basic word overlap

    Args:
        listing1 (dict): First listing data
        listing2 (dict): Second listing data

    Returns:
        float: Basic similarity score between 0 and 1
    """
    # Simple word overlap in title and description
    words1 = set((listing1['title'] + ' ' + listing1['description']).lower().split())
    words2 = set((listing2['title'] + ' ' + listing2['description']).lower().split())

    if not words1 or not words2:
        return 0.0

    common_words = words1.intersection(words2)
    similarity = len(common_words) / max(len(words1), len(words2))

    return min(similarity, 1.0)

def generate_chatbot_response(user_message, conversation_history=None):
    """
    Generate intelligent response for chatbot using semantic understanding

    Args:
        user_message (str): User's input message
        conversation_history (list): Previous conversation context

    Returns:
        tuple: (response_text, is_answered)
    """
    user_message_lower = user_message.lower()

    # Check for greetings
    if any(greeting in user_message_lower for greeting in CHATBOT_KNOWLEDGE_BASE["greetings"]):
        return "Hello! I'm the FindersNotKeepers assistant. How can I help you with lost and found items today?", True

    # Check for farewells
    if any(farewell in user_message_lower for farewell in CHATBOT_KNOWLEDGE_BASE["farewells"]):
        return "Goodbye! Feel free to ask if you need any more help with FindersNotKeepers.", True

    # Semantic matching for help topics
    best_match_topic = None
    highest_similarity = 0

    for topic, description in CHATBOT_KNOWLEDGE_BASE["help_topics"].items():
        # Simple keyword matching for demo (would use embeddings in production)
        topic_keywords = topic.split('_')
        description_keywords = description.lower().split()

        all_keywords = topic_keywords + description_keywords
        user_words = user_message_lower.split()

        # Calculate word overlap
        common_words = set(all_keywords).intersection(set(user_words))
        similarity = len(common_words) / max(len(set(all_keywords)), len(set(user_words)))

        if similarity > highest_similarity and similarity > 0.1:
            highest_similarity = similarity
            best_match_topic = topic

    if best_match_topic:
        response = CHATBOT_KNOWLEDGE_BASE["help_topics"][best_match_topic]
        # Add follow-up offer
        response += "\n\nIs there anything else I can help you with?"
        return response, True

    # Fallback responses for common questions
    fallback_responses = {
        "how": "I can help you report lost or found items, search for items, or understand how our AI matching works. What would you like to know?",
        "what": "FindersNotKeepers is a platform that helps reunite lost items with their owners using AI-powered matching.",
        "where": "You can access all features through our website. Specific functions are available in different sections like Search, Report, and your Profile.",
        "when": "You can use FindersNotKeepers anytime! Items are matched automatically when new listings are created.",
        "why": "Our platform makes it easier to recover lost items and return found items to their rightful owners through intelligent matching."
    }

    for question_word, response in fallback_responses.items():
        if user_message_lower.startswith(question_word):
            return response, True

    # If no good match found, use OpenAI (commented out for demo)
    # try:
    #     response = openai.ChatCompletion.create(
    #         model="gpt-3.5-turbo",
    #         messages=[
    #             {"role": "system", "content": "You are a helpful assistant for FindersNotKeepers, a lost and found platform. Provide helpful information about reporting lost/found items, searching, and using the platform."},
    #             {"role": "user", "content": user_message}
    #         ],
    #         max_tokens=150
    #     )
    #     return response.choices[0].message.content, True
    # except Exception as e:
    #     print(f"OpenAI API error: {e}")

    # Final fallback
    fallback_response = "I'm not sure I understand. I can help you with reporting lost/found items, searching the database, or explaining how our AI matching works. Could you rephrase your question?"
    return fallback_response, False

def track_unanswered_question(question):
    """
    Track unanswered questions to improve chatbot knowledge

    Args:
        question (str): The unanswered question
    """
    global unanswered_questions

    # Check if similar question already exists
    for uq in unanswered_questions:
        if calculate_basic_similarity(
            {'title': question, 'description': ''},
            {'title': uq['question'], 'description': ''}
        ) > 0.6:
            uq['count'] += 1
            uq['last_asked'] = datetime.now().isoformat()
            return

    # Add new unanswered question
    unanswered_questions.append({
        'question': question,
        'count': 1,
        'first_asked': datetime.now().isoformat(),
        'last_asked': datetime.now().isoformat()
    })

def get_unanswered_questions():
    """Get list of unanswered questions sorted by frequency"""
    global unanswered_questions
    return sorted(unanswered_questions, key=lambda x: x['count'], reverse=True)

def enhance_with_openai_similarity(listing1, listing2):
    """
    Enhanced similarity calculation using OpenAI embeddings
    (Would be used in production with actual API key)

    Args:
        listing1 (dict): First listing data
        listing2 (dict): Second listing data

    Returns:
        float: Enhanced similarity score
    """
    # This would use actual OpenAI embeddings in production
    # For demo purposes, we'll use the basic similarity
    return calculate_semantic_similarity(listing1, listing2)