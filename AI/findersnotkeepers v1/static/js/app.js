/**
 * Main Application JavaScript for FindersNotKeepers
 * Handles core functionality, notifications, and main page interactions
 */

// Global application state
let appState = {
    user: null,
    notifications: [],
    unreadNotifications: 0,
    currentPage: 'home'
};

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeApplication();
    setupEventListeners();
    checkAuthenticationStatus();
});

/**
 * Initialize main application components
 */
function initializeApplication() {
    // Load initial data
    loadListings();
    loadNotifications();

    // Initialize AI threshold from user preferences
    initializeAIThreshold();

    // Set up notification bell
    initializeNotificationBell();
}

/**
 * Set up global event listeners
 */
function setupEventListeners() {
    // Login/logout buttons
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (loginBtn) {
        loginBtn.addEventListener('click', handleLoginClick);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Listing form submission
    const listingForm = document.getElementById('listing-form');
    if (listingForm) {
        listingForm.addEventListener('submit', handleListingSubmit);
    }

    // Notification bell
    const notificationBell = document.getElementById('notification-bell');
    if (notificationBell) {
        notificationBell.addEventListener('click', toggleNotificationPanel);
    }

    // Close notification panel when clicking outside
    document.addEventListener('click', function(event) {
        const notificationPanel = document.getElementById('notification-panel');
        const notificationBell = document.getElementById('notification-bell');

        if (notificationPanel && notificationPanel.classList.contains('active') &&
            !notificationPanel.contains(event.target) &&
            !notificationBell.contains(event.target)) {
            notificationPanel.classList.remove('active');
        }
    });
}

/**
 * Check if user is authenticated and update UI
 */
async function checkAuthenticationStatus() {
    try {
        // In a real app, this would verify the session with the server
        // For demo, we'll check if we have user data in sessionStorage
        const userData = sessionStorage.getItem('currentUser');

        if (userData) {
            appState.user = JSON.parse(userData);
            updateUIForAuthenticatedUser();
        } else {
            updateUIForPublicUser();
        }
    } catch (error) {
        console.error('Error checking authentication:', error);
        updateUIForPublicUser();
    }
}

/**
 * Update UI for authenticated user
 */
function updateUIForAuthenticatedUser() {
    // Show user-specific elements
    const userElements = document.querySelectorAll('.user-only');
    const publicElements = document.querySelectorAll('.public-only');

    userElements.forEach(el => {
        el.style.display = 'block';
    });

    publicElements.forEach(el => {
        el.style.display = 'none';
    });

    // Update user info in navigation
    const userInfoElement = document.getElementById('user-info');
    if (userInfoElement && appState.user) {
        userInfoElement.textContent = `Welcome, ${appState.user.name}`;
    }

    // Load user-specific data
    loadNotifications();
}

/**
 * Update UI for public user
 */
function updateUIForPublicUser() {
    // Show public elements, hide user-specific ones
    const userElements = document.querySelectorAll('.user-only');
    const publicElements = document.querySelectorAll('.public-only');

    userElements.forEach(el => {
        el.style.display = 'none';
    });

    publicElements.forEach(el => {
        el.style.display = 'block';
    });
}

/**
 * Handle login button click
 */
function handleLoginClick() {
    // Redirect to login page, saving current page for return
    const currentPath = window.location.pathname + window.location.search;
    sessionStorage.setItem('redirectAfterLogin', currentPath);
    window.location.href = '/login';
}

/**
 * Handle user logout
 */
async function handleLogout() {
    try {
        const response = await fetch('/api/logout');

        if (response.ok) {
            // Clear local state
            appState.user = null;
            appState.notifications = [];
            appState.unreadNotifications = 0;

            // Clear storage
            sessionStorage.removeItem('currentUser');

            // Update UI
            updateUIForPublicUser();

            // Reload page to reset state
            window.location.reload();
        }
    } catch (error) {
        console.error('Error during logout:', error);
    }
}

/**
 * Load listings from server and display them
 */
async function loadListings() {
    try {
        const response = await fetch('/api/listings');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const listings = await response.json();
        renderListings(listings);
    } catch (error) {
        console.error('Error loading listings:', error);
        // Fallback to empty state
        renderListings([]);
    }
}

/**
 * Render listings to the page
 * @param {Array} listings - Array of listing objects
 */
function renderListings(listings) {
    const listingsContainer = document.getElementById('listings-container');

    if (!listingsContainer) return;

    // Clear existing listings
    listingsContainer.innerHTML = '';

    // Handle empty state
    if (listings.length === 0) {
        listingsContainer.innerHTML = `
            <div class="empty-state">
                <h3>No listings yet</h3>
                <p>Be the first to report a lost or found item!</p>
            </div>
        `;
        return;
    }

    // Create and append listing cards
    listings.forEach(listing => {
        const listingCard = createListingCard(listing);
        listingsContainer.appendChild(listingCard);
    });
}

/**
 * Create a listing card element for the main page
 * @param {Object} listing - Listing data object
 * @returns {HTMLElement} Listing card element
 */
function createListingCard(listing) {
    const card = document.createElement('div');
    card.className = 'listing-card';
    card.innerHTML = `
        <div class="card-img">
            <img src="${listing.image}" alt="${listing.title}" width="300" height="200">
        </div>
        <div class="card-content">
            <h3 class="card-title">${escapeHtml(listing.title)}</h3>
            <div class="card-details">
                <p>${escapeHtml(truncateText(listing.description, 100))}</p>
                <p><strong>Location:</strong> ${escapeHtml(listing.location)}</p>
                <p><strong>Date:</strong> ${formatDate(listing.date)}</p>
            </div>
            <span class="card-status ${listing.type === 'lost' ? 'status-lost' : 'status-found'}">
                ${listing.type === 'lost' ? 'LOST' : 'FOUND'}
            </span>
        </div>
    `;

    // Add click event to view details
    card.addEventListener('click', () => {
        viewListingDetails(listing);
    });

    return card;
}

/**
 * Handle new listing form submission
 * @param {Event} e - Form submission event
 */
async function handleListingSubmit(e) {
    e.preventDefault();

    // Check if user is authenticated
    if (!appState.user) {
        alert('Please log in to create a listing');
        handleLoginClick();
        return;
    }

    // Get form data
    const formData = {
        type: document.getElementById('item-type').value,
        title: document.getElementById('item-title').value,
        description: document.getElementById('item-description').value,
        category: document.getElementById('item-category').value,
        location: document.getElementById('item-location').value,
        date: document.getElementById('item-date').value
    };

    // Validate required fields
    if (!formData.type || !formData.title || !formData.description || !formData.category || !formData.location || !formData.date) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<span class="spinner"></span> Creating Listing...';
        submitBtn.disabled = true;

        // Send to server
        const response = await fetch('/api/listings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            // Reset form
            e.target.reset();

            // Show success message
            showMessage('Listing created successfully! AI matching is running in the background.', 'success');

            // Reload listings and notifications after a delay
            setTimeout(() => {
                loadListings();
                loadNotifications();
            }, 1000);

        } else {
            throw new Error('Failed to create listing');
        }
    } catch (error) {
        console.error('Error creating listing:', error);
        showMessage('Error creating listing. Please try again.', 'error');
    } finally {
        // Reset button state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Submit Listing';
        submitBtn.disabled = false;
    }
}

/**
 * Load user notifications from server
 */
async function loadNotifications() {
    try {
        const response = await fetch('/api/notifications');

        if (response.ok) {
            const notifications = await response.json();
            appState.notifications = notifications;
            appState.unreadNotifications = notifications.filter(n => !n.read).length;

            updateNotificationBadge();
            renderNotifications(notifications);
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

/**
 * Update notification badge count
 */
function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    const bell = document.getElementById('notification-bell');

    if (badge) {
        if (appState.unreadNotifications > 0) {
            badge.textContent = appState.unreadNotifications;
            badge.style.display = 'flex';

            // Add pulse animation for new notifications
            if (bell) {
                bell.classList.add('has-notifications');
            }
        } else {
            badge.style.display = 'none';
            if (bell) {
                bell.classList.remove('has-notifications');
            }
        }
    }
}

/**
 * Render notifications in the notification panel
 * @param {Array} notifications - Array of notification objects
 */
function renderNotifications(notifications) {
    const notificationsList = document.getElementById('notifications-list');
    const notificationPanel = document.getElementById('notification-panel-content');

    // Update main notifications list (sidebar)
    if (notificationsList) {
        if (notifications.length === 0) {
            notificationsList.innerHTML = '<p class="empty-state">No notifications yet</p>';
        } else {
            notificationsList.innerHTML = '';
            notifications.slice(0, 5).forEach(notification => { // Show only 5 in sidebar
                const notificationEl = createNotificationElement(notification);
                notificationsList.appendChild(notificationEl);
            });
        }
    }

    // Update notification panel (dropdown)
    if (notificationPanel) {
        if (notifications.length === 0) {
            notificationPanel.innerHTML = '<p class="empty-state">No notifications</p>';
        } else {
            notificationPanel.innerHTML = '';
            notifications.forEach(notification => {
                const notificationEl = createNotificationElement(notification, true);
                notificationPanel.appendChild(notificationEl);
            });
        }
    }
}

/**
 * Create notification element
 * @param {Object} notification - Notification object
 * @param {boolean} isInPanel - Whether this is for the dropdown panel
 * @returns {HTMLElement} Notification element
 */
function createNotificationElement(notification, isInPanel = false) {
    const notificationEl = document.createElement('div');
    notificationEl.className = `notification-item ${notification.read ? '' : 'unread'}`;
    notificationEl.innerHTML = `
        <div class="notification-content">
            <strong>${escapeHtml(notification.title)}</strong>
            <p>${escapeHtml(notification.message)}</p>
            ${notification.similarity ? `<p class="notification-match">Similarity: ${Math.round(notification.similarity * 100)}%</p>` : ''}
            <small>${formatDate(notification.timestamp)}</small>
        </div>
    `;

    // Add click handler
    notificationEl.addEventListener('click', async () => {
        await handleNotificationClick(notification, notificationEl);
    });

    return notificationEl;
}

/**
 * Handle notification click
 * @param {Object} notification - Notification object
 * @param {HTMLElement} notificationEl - Notification element
 */
async function handleNotificationClick(notification, notificationEl) {
    try {
        // Mark as read
        if (!notification.read) {
            await markNotificationAsRead(notification.id);
            notificationEl.classList.remove('unread');
            appState.unreadNotifications = Math.max(0, appState.unreadNotifications - 1);
            updateNotificationBadge();
        }

        // If it's a match notification, show match details
        if (notification.type === 'match_found' && notification.match_listing_id) {
            await showMatchDetails(notification.match_listing_id, notification.similarity);
        }

        // Close notification panel if open
        const notificationPanel = document.getElementById('notification-panel');
        if (notificationPanel) {
            notificationPanel.classList.remove('active');
        }
    } catch (error) {
        console.error('Error handling notification click:', error);
    }
}

/**
 * Mark a notification as read
 * @param {number} notificationId - Notification ID
 */
async function markNotificationAsRead(notificationId) {
    try {
        await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'POST'
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

/**
 * Show match details modal
 * @param {number} listingId - Matching listing ID
 * @param {number} similarity - Similarity score
 */
async function showMatchDetails(listingId, similarity) {
    try {
        // Fetch listing details
        const response = await fetch(`/api/listings/${listingId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch listing details');
        }

        const listing = await response.json();

        // Create and show modal
        showMatchModal(listing, similarity);
    } catch (error) {
        console.error('Error showing match details:', error);
        alert('Error loading match details. Please try again.');
    }
}

/**
 * Show match details modal
 * @param {Object} listing - Matching listing data
 * @param {number} similarity - Similarity percentage
 */
function showMatchModal(listing, similarity) {
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>🎯 Potential Match Found!</h3>
                <button class="close-modal">×</button>
            </div>
            
            <div class="match-details">
                <p><strong>Similarity Score:</strong> <span class="similarity-badge">${Math.round(similarity * 100)}% match</span></p>
            </div>
            
            <div class="match-details">
                <h4>Matching Item Details</h4>
                <p><strong>Title:</strong> ${escapeHtml(listing.title)}</p>
                <p><strong>Type:</strong> <span style="text-transform: capitalize;">${listing.type}</span></p>
                <p><strong>Category:</strong> ${escapeHtml(listing.category)}</p>
                <p><strong>Description:</strong> ${escapeHtml(listing.description)}</p>
                <p><strong>Location:</strong> ${escapeHtml(listing.location)}</p>
                <p><strong>Date:</strong> ${formatDate(listing.date)}</p>
            </div>
            
            <div class="modal-actions">
                <button id="contact-owner" class="btn btn-primary">Contact Owner</button>
                <button id="close-modal-btn" class="btn btn-secondary">Close</button>
            </div>
        </div>
    `;

    // Add to document
    document.body.appendChild(modal);

    // Event listeners
    const closeModal = () => document.body.removeChild(modal);

    modal.querySelector('.close-modal').addEventListener('click', closeModal);
    modal.querySelector('#close-modal-btn').addEventListener('click', closeModal);
    modal.querySelector('#contact-owner').addEventListener('click', () => {
        alert('Contact feature would open here!\n\nYou would be able to message the owner of this item securely.');
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function handleEscape(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    });
}

/**
 * Initialize notification bell functionality
 */
function initializeNotificationBell() {
    const notificationBell = document.getElementById('notification-bell');

    if (notificationBell) {
        // Create notification panel if it doesn't exist
        if (!document.getElementById('notification-panel')) {
            const panel = document.createElement('div');
            panel.id = 'notification-panel';
            panel.className = 'notification-panel';
            panel.innerHTML = `
                <div class="notification-panel-header">
                    <h4>Notifications</h4>
                    <button id="close-notification-panel">×</button>
                </div>
                <div class="notification-panel-content">
                    <div class="empty-state">Loading notifications...</div>
                </div>
            `;

            notificationBell.parentNode.appendChild(panel);

            // Close panel button
            document.getElementById('close-notification-panel').addEventListener('click', () => {
                panel.classList.remove('active');
            });
        }
    }
}

/**
 * Toggle notification panel visibility
 */
function toggleNotificationPanel() {
    const panel = document.getElementById('notification-panel');
    if (panel) {
        panel.classList.toggle('active');
    }
}

/**
 * Initialize AI threshold from user preferences
 */
function initializeAIThreshold() {
    const thresholdSlider = document.getElementById('similarity-threshold');
    const thresholdValue = document.getElementById('threshold-value');

    if (thresholdSlider && thresholdValue) {
        // Set initial value from user preference or default
        const initialThreshold = appState.user?.similarityThreshold || 0.7;
        thresholdSlider.value = initialThreshold * 100;
        thresholdValue.textContent = `${Math.round(initialThreshold * 100)}%`;

        // Add event listener for changes
        thresholdSlider.addEventListener('input', function() {
            const threshold = parseFloat(this.value) / 100;
            thresholdValue.textContent = `${this.value}%`;
            updateAIThreshold(threshold);
        });
    }
}

/**
 * Update AI similarity threshold
 * @param {number} threshold - New threshold value (0-1)
 */
async function updateAIThreshold(threshold) {
    try {
        const response = await fetch('/api/ai/threshold', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ threshold: threshold })
        });

        if (response.ok) {
            console.log('AI threshold updated to:', threshold);
        }
    } catch (error) {
        console.error('Error updating AI threshold:', error);
    }
}

/**
 * View listing details (simplified for demo)
 * @param {Object} listing - Listing data
 */
function viewListingDetails(listing) {
    // In a full implementation, this would show a detailed view or modal
    const details = `
        Title: ${listing.title}
        Type: ${listing.type}
        Category: ${listing.category}
        Location: ${listing.location}
        Date: ${listing.date}
        Description: ${listing.description}
    `;

    alert(`Item Details:\n\n${details}`);
}

/**
 * Show message to user
 * @param {string} message - Message to display
 * @param {string} type - Message type (success, error, info)
 */
function showMessage(message, type = 'info') {
    // Simple message display - could be enhanced with a proper toast system
    const styles = {
        success: 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;',
        error: 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;',
        info: 'background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb;'
    };

    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem;
        border-radius: 4px;
        z-index: 1001;
        ${styles[type] || styles.info}
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    messageDiv.textContent = message;

    document.body.appendChild(messageDiv);

    // Remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, length) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions available globally for HTML onclick handlers
window.handleLoginClick = handleLoginClick;
window.handleLogout = handleLogout;
window.toggleNotificationPanel = toggleNotificationPanel;