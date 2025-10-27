# chatbot.py
from typing import Dict

class SupportChatbot:
    def __init__(self):
        self.knowledge_base = {
            "how do i report a lost item": "Click 'Report Lost Item', fill in details...",
            "how do i report a found item": "Click 'Report Found Item', provide details...",
            "how does matching work": "Our AI matches lost/found items based on description, category...",
            "how do i claim an item": "Click 'Claim Item' and provide proof...",
            "is my information safe": "Yes! Secure messaging, no contact details shared...",
            "what categories can i report": "Electronics, clothing, documents...",
            "contact support": "Email: support@findersnotkeepers.com, Phone: +1-555-0123",
            "hello": "Hello! How can I help you today?",
            "hi": "Hi there! I'm here to help!",
            "help": "I can help you with: reporting lost/found items, claiming items, etc."
        }

    def get_response(self, question: str) -> str:
        if not question or question.strip() == "":
            return "How can I help you today?"
        question_lower = question.lower().strip()
        for key in self.knowledge_base:
            if key in question_lower:
                return self.knowledge_base[key]
        return "I'm not sure about that. Please contact support@findersnotkeepers.com."

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
def get_chatbot():
    global chatbot_instance
    if chatbot_instance is None:
        chatbot_instance = SupportChatbot()
    return chatbot_instance
