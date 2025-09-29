/**
 * Chatbot JavaScript for FindersNotKeepers
 * Handles FAQ chatbot functionality with semantic conversations
 */

// Chatbot state
let chatbotState = {
    isOpen: false,
    conversationHistory: [],
    isMinimized: false
};

/**
 * Initialize chatbot when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeChatbot();
    loadChatbotHistory();
});

/**
 * Initialize chatbot components and event listeners
 */
function initializeChatbot() {
    // FAQ button event listener
    const faqButton = document.getElementById('faq-button');
    if (faqButton) {
        faqButton.addEventListener('click', toggleChatbot);
    }

    // Chatbot control buttons
    const minimizeChat = document.getElementById('minimize-chat');
    const closeChat = document.getElementById('close-chat');
    const sendMessageBtn = document.getElementById('send-message');

    if (minimizeChat) {
        minimizeChat.addEventListener('click', minimizeChatbot);
    }

    if (closeChat) {
        closeChat.addEventListener('click', closeChatbot);
    }

    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', handleUserMessage);
    }

    // Enter key support for message input
    const userInput = document.getElementById('user-input');
    if (userInput) {
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleUserMessage();
            }
        });
    }

    // Load initial greeting
    displayBotMessage("Hello! I'm the FindersNotKeepers assistant. I can help you with reporting lost/found items, searching, AI matching, and more. How can I help you today?");
}

/**
 * Toggle chatbot visibility
 */
function toggleChatbot() {
    const chatbot = document.getElementById('chatbot');

    if (!chatbotState.isOpen) {
        // Open chatbot
        chatbot.style.display = 'flex';
        chatbotState.isOpen = true;
        chatbotState.isMinimized = false;

        // Focus on input field
        const userInput = document.getElementById('user-input');
        if (userInput) {
            userInput.focus();
        }
    } else if (chatbotState.isMinimized) {
        // Restore from minimized state
        maximizeChatbot();
    } else {
        // Minimize if already open
        minimizeChatbot();
    }
}

/**
 * Minimize chatbot to just header
 */
function minimizeChatbot() {
    const chatbot = document.getElementById('chatbot');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.querySelector('.chatbot-input');

    if (chatbot && chatMessages && chatInput) {
        chatMessages.style.display = 'none';
        chatInput.style.display = 'none';
        chatbot.style.height = 'auto';
        chatbotState.isMinimized = true;
    }
}

/**
 * Maximize chatbot to full size
 */
function maximizeChatbot() {
    const chatbot = document.getElementById('chatbot');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.querySelector('.chatbot-input');

    if (chatbot && chatMessages && chatInput) {
        chatMessages.style.display = 'flex';
        chatInput.style.display = 'flex';
        chatbot.style.height = '500px';
        chatbotState.isMinimized = false;

        // Scroll to bottom
        scrollChatToBottom();
    }
}

/**
 * Close chatbot completely
 */
function closeChatbot() {
    const chatbot = document.getElementById('chatbot');
    if (chatbot) {
        chatbot.style.display = 'none';
        chatbotState.isOpen = false;
        chatbotState.isMinimized = false;

        // Save conversation history before closing
        saveChatbotHistory();
    }
}

/**
 * Handle user message submission
 */
async function handleUserMessage() {
    const userInput = document.getElementById('user-input');
    const message = userInput.value.trim();

    if (!message) return;

    // Add user message to chat
    addMessageToChat(message, 'user');

    // Clear input
    userInput.value = '';

    // Show typing indicator
    showTypingIndicator();

    try {
        // Send to server for processing
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                history: chatbotState.conversationHistory
            })
        });

        if (response.ok) {
            const data = await response.json();

            // Update conversation history
            chatbotState.conversationHistory = data.history;

            // Remove typing indicator and add bot response
            removeTypingIndicator();
            addMessageToChat(data.response, 'bot');

            // Save updated history
            saveChatbotHistory();

        } else {
            throw new Error('Server error');
        }
    } catch (error) {
        console.error('Error getting chatbot response:', error);

        // Remove typing indicator
        removeTypingIndicator();

        // Fallback to client-side response
        const fallbackResponse = generateFallbackResponse(message);
        addMessageToChat(fallbackResponse, 'bot');

        // Update conversation history
        chatbotState.conversationHistory.push(
            { role: 'user', content: message },
            { role: 'assistant', content: fallbackResponse }
        );

        saveChatbotHistory();
    }
}

/**
 * Add message to chat display
 * @param {string} message - Message text
 * @param {string} sender - 'user' or 'bot'
 */
function addMessageToChat(message, sender) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const messageEl = document.createElement('div');
    messageEl.className = `message ${sender}-message`;
    messageEl.textContent = message;

    chatMessages.appendChild(messageEl);
    scrollChatToBottom();
}

/**
 * Display bot message (for initial greeting, etc.)
 * @param {string} message - Message text
 */
function displayBotMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    // Clear existing messages except the first bot message
    const existingMessages = chatMessages.querySelectorAll('.message');
    if (existingMessages.length > 1) {
        for (let i = 1; i < existingMessages.length; i++) {
            chatMessages.removeChild(existingMessages[i]);
        }
    }

    // Update first message or add new one
    if (existingMessages.length === 0) {
        addMessageToChat(message, 'bot');
    } else {
        existingMessages[0].textContent = message;
    }

    // Reset conversation history
    chatbotState.conversationHistory = [
        { role: 'assistant', content: message }
    ];
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const typingEl = document.createElement('div');
    typingEl.id = 'typing-indicator';
    typingEl.className = 'message bot-message typing-indicator';
    typingEl.innerHTML = `
        <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;

    chatMessages.appendChild(typingEl);
    scrollChatToBottom();
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator() {
    const typingEl = document.getElementById('typing-indicator');
    if (typingEl && typingEl.parentNode) {
        typingEl.parentNode.removeChild(typingEl);
    }
}

/**
 * Generate fallback response when server is unavailable
 * @param {string} message - User message
 * @returns {string} Fallback response
 */
function generateFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();

    // Enhanced keyword matching with semantic understanding
    if (lowerMessage.includes('lost') && (lowerMessage.includes('how') || lowerMessage.includes('report'))) {
        return "To report a lost item:\n1. Go to the homepage\n2. Click 'Report Lost Item'\n3. Fill in item details (title, description, category, location, date)\n4. Our AI will automatically search for matches!\n\nYou'll get notifications if potential matches are found.";
    }

    if (lowerMessage.includes('found') && (lowerMessage.includes('how') || lowerMessage.includes('report'))) {
        return "To report a found item:\n1. Go to the homepage\n2. Click 'Report Found Item'\n3. Provide detailed description of the item\n4. Specify where and when you found it\n5. Our system will match it with lost items\n\nThis helps reunite items with their owners!";
    }

    if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
        return "You can search for items in several ways:\n• Keyword search (title/description)\n• Category filtering\n• Location-based search\n• Advanced filters (date, item type)\n\nVisit the Search page for all these options!";
    }

    if (lowerMessage.includes('match') || lowerMessage.includes('similar') || lowerMessage.includes('ai')) {
        return "Our AI matching works by:\n1. Analyzing item descriptions semantically\n2. Comparing categories and locations\n3. Calculating similarity scores\n4. Notifying users of potential matches\n\nYou can adjust the similarity threshold in the AI panel!";
    }

    if (lowerMessage.includes('notificat')) {
        return "You'll receive notifications for:\n• New potential matches for your items\n• When someone claims your found item\n• Account-related updates\n• Important system announcements\n\nNotifications appear with a red badge on the bell icon.";
    }

    if (lowerMessage.includes('claim') || lowerMessage.includes('proof') || lowerMessage.includes('owner')) {
        return "To claim an item:\n1. Find the item in search results\n2. Click 'Claim Item'\n3. Provide proof of ownership (photos, receipts, detailed description)\n4. An admin will verify your claim\n5. If approved, you can arrange pickup with the finder";
    }

    if (lowerMessage.includes('contact') || lowerMessage.includes('message')) {
        return "Our secure messaging system:\n• Protects your personal contact information\n• Allows communication between finders and owners\n• Keeps all messages within the platform\n• Maintains privacy and security\n\nClick 'Contact Owner' on any listing to start a conversation!";
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return "Hello! 👋 I'm here to help you with FindersNotKeepers. You can ask me about reporting items, searching, AI matching, notifications, or anything else about the platform!";
    }

    if (lowerMessage.includes('thank')) {
        return "You're welcome! 😊 Is there anything else I can help you with today?";
    }

    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
        return "Goodbye! Feel free to ask if you need any more help. Remember to check your notifications for potential matches! 👋";
    }

    // Semantic understanding for common questions
    if (lowerMessage.includes('work') || lowerMessage.includes('does it work')) {
        return "FindersNotKeepers works by connecting people who lost items with those who found them. Users create listings, our AI finds matches, and our secure system helps reunite items with their owners while protecting everyone's privacy.";
    }

    if (lowerMessage.includes('safe') || lowerMessage.includes('secure') || lowerMessage.includes('privacy')) {
        return "Yes, we take security seriously! Features include:\n• Secure messaging (no personal contact sharing)\n• Admin verification for claims\n• Protected user data\n• Secure authentication\n• Privacy-focused design";
    }

    if (lowerMessage.includes('cost') || lowerMessage.includes('price') || lowerMessage.includes('free')) {
        return "FindersNotKeepers is completely free to use! We believe in helping people recover lost items without any cost barriers.";
    }

    // Default response for unrecognized questions
    return "I'm not sure I understand. I can help you with:\n• Reporting lost/found items\n• Searching the database\n• Understanding AI matching\n• Notification system\n• Claiming process\n• Account management\n\nCould you rephrase your question or ask about one of these topics?";
}

/**
 * Scroll chat to bottom to show latest messages
 */
function scrollChatToBottom() {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

/**
 * Save chatbot conversation history to session storage
 */
function saveChatbotHistory() {
    try {
        sessionStorage.setItem('chatbotHistory', JSON.stringify(chatbotState.conversationHistory));
    } catch (error) {
        console.error('Error saving chatbot history:', error);
    }
}

/**
 * Load chatbot conversation history from session storage
 */
function loadChatbotHistory() {
    try {
        const savedHistory = sessionStorage.getItem('chatbotHistory');
        if (savedHistory) {
            chatbotState.conversationHistory = JSON.parse(savedHistory);

            // Replay conversation history in chat
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                chatMessages.innerHTML = '';
                chatbotState.conversationHistory.forEach(msg => {
                    if (msg.role === 'user' || msg.role === 'assistant') {
                        addMessageToChat(msg.content, msg.role === 'user' ? 'user' : 'bot');
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error loading chatbot history:', error);
    }
}

/**
 * Clear chatbot conversation history
 */
function clearChatbotHistory() {
    chatbotState.conversationHistory = [];
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    sessionStorage.removeItem('chatbotHistory');

    // Reset to initial greeting
    displayBotMessage("Hello! I'm the FindersNotKeepers assistant. I can help you with reporting lost/found items, searching, AI matching, and more. How can I help you today?");
}

// Add CSS for typing indicator
const typingStyles = `
    .typing-indicator {
        background-color: #f1f1f1 !important;
    }
    
    .typing-dots {
        display: flex;
        gap: 4px;
    }
    
    .typing-dots span {
        height: 8px;
        width: 8px;
        background-color: #999;
        border-radius: 50%;
        display: inline-block;
        animation: typingAnimation 1.4s infinite ease-in-out both;
    }
    
    .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
    .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes typingAnimation {
        0%, 80%, 100% { 
            transform: scale(0.8);
            opacity: 0.5;
        }
        40% { 
            transform: scale(1);
            opacity: 1;
        }
    }
`;

// Inject typing styles
const styleSheet = document.createElement('style');
styleSheet.textContent = typingStyles;
document.head.appendChild(styleSheet);

// Make functions available globally
window.toggleChatbot = toggleChatbot;
window.minimizeChatbot = minimizeChatbot;
window.closeChatbot = closeChatbot;
window.clearChatbotHistory = clearChatbotHistory;