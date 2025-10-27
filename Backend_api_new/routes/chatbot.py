# routes/chatbot.py
class SimpleChatbot:
    def __init__(self):
        self.responses = {
            "hello": "Hi there! How can I assist you today?",
            "help": "You can ask me about lost or found items, reporting listings, or using the site.",
            "report": "To report an item, go to the 'REPORT' section and fill in the details.",
            "lost": "If you've lost an item, you can browse recent found listings on the home page.",
            "found": "If you've found something, please report it using the 'REPORT' button.",
            "contact": "You can contact other users through the listing’s contact form.",
        }

    def handle_conversation(self, message):
        message_lower = message.lower()
        for key, reply in self.responses.items():
            if key in message_lower:
                return reply
        return "I'm not sure I understand. You can ask things like 'How do I report a lost item?' or 'Where can I view my listings?'"


def get_chatbot():
    return SimpleChatbot()
