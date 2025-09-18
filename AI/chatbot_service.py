'''from langchain_openai import OpenAI, OpenAIEmbeddings
from langchain.chains import RetrievalQA
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import CharacterTextSplitter
from langchain.prompts import PromptTemplate
from typing import Dict
import os

class SupportChatbot:
    def __init__(self, openai_api_key: str):
        self.openai_api_key = openai_api_key
        print(f"Creating OpenAI instance with key: {openai_api_key[:10]}...")  # Debug
        try:
            self.llm = OpenAI(openai_api_key=openai_api_key, temperature=0.1)
            self.vector_store = None
            self.qa_chain = None
            self.setup_knowledge_base()
            print("Chatbot initialized successfully!")
        except Exception as e:
            print(f"Error initializing chatbot: {str(e)}")
            raise

    def setup_knowledge_base(self):
        """Set up the knowledge base with FAQ and documentation"""
        print("Setting up knowledge base...")
        knowledge_content = """
        FindersNotKeepers Platform FAQ:
        Q: How do I report a lost item?
        A: Click 'Report Lost Item', fill details including title, description, category, location, and when lost. Add photos.
        Q: How do I report a found item?
        A: Click 'Report Found Item', provide item details, location found, and when. Upload clear photos.
        Q: How does matching work?
        A: AI matches lost/found items based on descriptions, categories, locations, and timing. Get notifications for matches.
        Q: How do I claim an item?
        A: Click 'Claim Item' and provide proof of ownership. Admin reviews claims.
        Q: Is my information safe?
        A: Yes! Secure messaging, no contact details shared without permission.
        Q: What categories can I report?
        A: Electronics, clothing, documents, personal items, accessories, books, valuables.
        Contact: support@findersnotkeepers.com, Phone: +1-555-0123, Hours: Mon-Fri 9AM-5PM
        """

        text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        documents = text_splitter.split_text(knowledge_content)

        embeddings = OpenAIEmbeddings(openai_api_key=self.openai_api_key)
        self.vector_store = FAISS.from_texts(documents, embeddings)

        prompt_template = """You are a helpful support chatbot for FindersNotKeepers.
        Use context to answer. If unsure, say you don't know and suggest contacting support.
        Context: {context}
        Question: {question}
        Answer:"""

        PROMPT = PromptTemplate(template=prompt_template, input_variables=["context", "question"])

        self.qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.vector_store.as_retriever(),
            chain_type_kwargs={"prompt": PROMPT}
        )
        print("Knowledge base setup complete!")

    def get_response(self, question: str) -> str:
        try:
            print(f"Getting response for: {question}")
            result = self.qa_chain({"query": question})
            response = result['result']
            print(f"OpenAI response: {response}")
            return response
        except Exception as e:
            error_msg = f"I apologize, I'm having technical difficulties. Please try again later. Error: {str(e)}"
            print(f"Chatbot error: {str(e)}")
            import traceback
            traceback.print_exc()  # Show full error details
            return error_msg

# Singleton instance
chatbot_instance = None

def get_chatbot(openai_api_key: str):
    global chatbot_instance
    if chatbot_instance is None:
        print("Creating new chatbot instance...")
        chatbot_instance = SupportChatbot(openai_api_key)
    else:
        print("Using existing chatbot instance...")
    return chatbot_instance
'''

# Simple chatbot implementation without OpenAI dependency
from typing import Dict  # For type hints

class SupportChatbot:
    def __init__(self):
        # Knowledge base with predefined questions and answers
        self.knowledge_base = {
            "how do i report a lost item": "Click on 'Report Lost Item', fill in details including title, description, category, location, and when lost. Add photos if possible.",
            "how do i report a found item": "Click on 'Report Found Item', provide item details, location found, and when. Upload clear photos.",
            "how does matching work": "Our AI system matches lost and found items based on descriptions, categories, locations, and timing. You'll get notifications for potential matches.",
            "how do i claim an item": "Click 'Claim Item' and provide proof of ownership. An admin will review your claim.",
            "is my information safe": "Yes! We use secure messaging and never share contact details without permission.",
            "what categories can i report": "Electronics, clothing, documents, personal items, accessories, books, and other valuables.",
            "contact support": "Email: support@findersnotkeepers.com, Phone: +1-555-0123, Hours: Mon-Fri 9AM-5PM",
            "hello": "Hello! How can I help you with FindersNotKeepers today?",
            "hi": "Hi there! I'm here to help with any questions about our lost and found platform.",
            "help": "I can help you with: reporting lost/found items, understanding matching, claiming items, and general platform questions."
        }

    # Method to get response for a question
    def get_response(self, question: str) -> str:
        if not question or question.strip() == "":
            return "How can I help you with FindersNotKeepers today?"

        # Convert question to lowercase for case-insensitive matching
        question_lower = question.lower().strip()

        # Check if question matches any key in knowledge base
        for key in self.knowledge_base:
            if key in question_lower:
                return self.knowledge_base[key]

        # Default response for unknown questions
        return "I'm not sure about that. Please contact support@findersnotkeepers.com for help with specific questions."

    # Method to handle conversation with session tracking
    def handle_conversation(self, message: str, session_id: str = None) -> Dict:
        response = self.get_response(message)

        return {
            "response": response,
            "session_id": session_id or "default",
            "suggested_questions": [
                "How do I report a lost item?",
                "How does matching work?",
                "How do I claim an item?",
                "Is my information secure?"
            ]
        }

# Singleton instance
chatbot_instance = None

# Function to get or create chatbot instance
def get_chatbot(openai_api_key: str = None):
    """Get or create chatbot instance - no API key needed for simple version"""
    global chatbot_instance
    if chatbot_instance is None:
        chatbot_instance = SupportChatbot()
    return chatbot_instance
