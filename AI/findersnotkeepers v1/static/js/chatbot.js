// DOM Elements
const faqButton = document.getElementById('faq-button');
const chatbot = document.getElementById('chatbot');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendMessageBtn = document.getElementById('send-message');
const minimizeChat = document.getElementById('minimize-chat');

// Initialize the chatbot
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners
    faqButton.addEventListener('click', toggleChatbot);
    minimizeChat.addEventListener('click', toggleChatbot);
    sendMessageBtn.addEventListener('click', handleUserMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleUserMessage();
        }
    });
});

// Toggle chatbot visibility
function toggleChatbot() {
    if (chatbot.style.display === 'block') {
        chatbot.style.display = 'none';
    } else {
        chatbot.style.display = 'block';
        userInput.focus();
    }
}

// Handle user messages in the chatbot
async function handleUserMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    
    // Clear input
    userInput.value = '';
    
    try {
        // Send to server for processing
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        if (response.ok) {
            const data = await response.json();
            addMessageToChat(data.response, 'bot');
        } else {
            throw new Error('Server error');
        }
    } catch (error) {
        console.error('Error getting chatbot response:', error);
        // Fallback to client-side response
        const response = generateBotResponseClient(message);
        addMessageToChat(response, 'bot');
    }
}

// Add message to chat
function addMessageToChat(message, sender) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${sender}-message`;
    messageEl.textContent = message;
    
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Client-side fallback response generation
function generateBotResponseClient(message) {
    const lowerMessage = message.toLowerCase();
    
    // FAQ responses
    if (lowerMessage.includes('how') && lowerMessage.includes('report')) {
        return "To report a lost or found item, simply fill out the form on the homepage with details about the item. Our AI will then try to match it with other listings.";
    } else if (lowerMessage.includes('match') || lowerMessage.includes('similar')) {
        return "Our AI matching algorithm compares new listings with existing ones based on category, description, and location. You can adjust the similarity threshold in the AI panel.";
    } else if (lowerMessage.includes('notification')) {
        return "You'll receive a notification when our AI finds a potential match for your item. The notification will show the similarity percentage.";
    } else if (lowerMessage.includes('claim') || lowerMessage.includes('proof')) {
        return "To claim an item, you need to provide proof of ownership. This could be a photo, receipt, or detailed description that matches the item.";
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return "Hello! How can I help you with FindersNotKeepers today?";
    } else {
        return "I'm sorry, I didn't understand that. I can help with questions about reporting items, the matching process, notifications, or claiming items.";
    }
}