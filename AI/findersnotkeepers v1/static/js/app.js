// Sample data for initial listings
const sampleListings = [
    {
        id: 1,
        type: 'lost',
        title: 'Black Laptop Bag',
        description: 'Black laptop bag with red zippers. Contains important documents and a charger.',
        category: 'accessories',
        location: 'Main Library, 2nd Floor',
        date: '2025-03-10',
        image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23cccccc"/><text x="150" y="100" font-family="Arial" font-size="20" text-anchor="middle" fill="%23666666">Laptop Bag Image</text></svg>'
    },
    {
        id: 2,
        type: 'found',
        title: 'Silver Water Bottle',
        description: 'Silver hydro flask water bottle with stickers on it. Found near the student center.',
        category: 'other',
        location: 'Student Center',
        date: '2025-03-15',
        image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23cccccc"/><text x="150" y="100" font-family="Arial" font-size="20" text-anchor="middle" fill="%23666666">Water Bottle Image</text></svg>'
    },
    {
        id: 3,
        type: 'lost',
        title: 'Wireless Headphones',
        description: 'Black Sony wireless headphones in a blue case. Lost during the football game.',
        category: 'electronics',
        location: 'Sports Field',
        date: '2025-03-12',
        image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23cccccc"/><text x="150" y="100" font-family="Arial" font-size="20" text-anchor="middle" fill="%23666666">Headphones Image</text></svg>'
    }
];

// DOM Elements
const listingsContainer = document.getElementById('listings-container');
const listingForm = document.getElementById('listing-form');
const notificationsList = document.getElementById('notifications-list');
const notificationCount = document.getElementById('notification-count');
const similarityThreshold = document.getElementById('similarity-threshold');
const thresholdValue = document.getElementById('threshold-value');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadListings();
    loadNotifications();
    
    // Set up event listeners
    listingForm.addEventListener('submit', handleListingSubmit);
    similarityThreshold.addEventListener('input', function() {
        thresholdValue.textContent = `${this.value}%`;
    });
});

// Load listings from server
async function loadListings() {
    try {
        const response = await fetch('/api/listings');
        const listings = await response.json();
        renderListings(listings);
    } catch (error) {
        console.error('Error loading listings:', error);
        // Fallback to sample data
        renderListings(sampleListings);
    }
}

// In your app.js, modify the loadNotifications function
async function loadNotifications() {
    try {
        const response = await fetch('/api/notifications');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const notifications = await response.json();
        console.log('Loaded notifications from server:', notifications);
        renderNotifications(notifications);
        updateNotificationCount(notifications);
    } catch (error) {
        console.error('Error loading notifications:', error);
        // Show empty state but don't break the UI
        notificationsList.innerHTML = '<p class="empty-state">Error loading notifications</p>';
        updateNotificationCount([]);
    }
}

// Render listings to the page
function renderListings(listings) {
    listingsContainer.innerHTML = '';
    
    if (listings.length === 0) {
        listingsContainer.innerHTML = '<p class="empty-state">No listings yet. Be the first to post!</p>';
        return;
    }
    
    listings.forEach(listing => {
        const listingCard = document.createElement('div');
        listingCard.className = 'listing-card';
        listingCard.innerHTML = `
            <div class="card-img">
                <img src="${listing.image}" alt="${listing.title}" width="300" height="200">
            </div>
            <div class="card-content">
                <h3 class="card-title">${listing.title}</h3>
                <div class="card-details">
                    <p>${listing.description}</p>
                    <p><strong>Location:</strong> ${listing.location}</p>
                    <p><strong>Date:</strong> ${formatDate(listing.date)}</p>
                </div>
                <span class="card-status ${listing.type === 'lost' ? 'status-lost' : 'status-found'}">
                    ${listing.type === 'lost' ? 'LOST' : 'FOUND'}
                </span>
            </div>
        `;
        listingsContainer.appendChild(listingCard);
    });
}

// Handle form submission for new listings
async function handleListingSubmit(e) {
    e.preventDefault();
    
    const type = document.getElementById('item-type').value;
    const title = document.getElementById('item-title').value;
    const description = document.getElementById('item-description').value;
    const category = document.getElementById('item-category').value;
    const location = document.getElementById('item-location').value;
    const date = document.getElementById('item-date').value;
    
    // Create new listing
    const newListing = {
        id: Date.now(), // Simple ID generation
        type,
        title,
        description,
        category,
        location,
        date,
        image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23cccccc"/><text x="150" y="100" font-family="Arial" font-size="20" text-anchor="middle" fill="%23666666">Item Image</text></svg>'
    };
    
    try {
        // Send to server
        const response = await fetch('/api/listings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newListing)
        });
        
        if (response.ok) {
            // Reset form
            listingForm.reset();

            // Wait a moment for backend processing, then reload
            setTimeout(() => {
                loadListings();
                loadNotifications();
            }, 1000); // 1 second delay to ensure backend processing completes

            // Show success message
            alert('Listing added successfully! AI matching is running in the background.');
        } else {
            alert('Error adding listing. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error adding listing. Please try again.');
    }
}

// // Render notifications
// function renderNotifications(notifications) {
//     notificationsList.innerHTML = '';
//
//     if (notifications.length === 0) {
//         notificationsList.innerHTML = '<p class="empty-state">No notifications yet</p>';
//         return;
//     }
//
//     notifications.forEach(notification => {
//         const notificationEl = document.createElement('div');
//         notificationEl.className = 'notification-item';
//         if (notification.read) {
//             notificationEl.style.opacity = '0.7';
//         }
//         notificationEl.innerHTML = `
//             <p>${notification.message}</p>
//             <p class="notification-match">Similarity: ${notification.similarity}%</p>
//             <small>${formatDate(notification.timestamp)}</small>
//         `;
//
//         notificationEl.addEventListener('click', async () => {
//             // Mark as read
//             notification.read = true;
//             notificationEl.style.opacity = '0.7';
//             updateNotificationCount(notifications);
//
//             // In a real app, we would update the server
//             // For demo, just show the matching listing
//             try {
//                 const response = await fetch('/api/listings');
//                 const listings = await response.json();
//                 const listing = listings.find(l => l.id === notification.matchId);
//
//                 if (listing) {
//                     alert(`Matching item: ${listing.title} (${listing.type})\nDescription: ${listing.description}\nLocation: ${listing.location}`);
//                 }
//             } catch (error) {
//                 console.error('Error loading listing details:', error);
//             }
//         });
//
//         notificationsList.appendChild(notificationEl);
//     });
// }

// Enhanced renderNotifications function
// Also add debug to the renderNotifications function
function renderNotifications(notifications) {
    console.log('Rendering notifications:', notifications);
    notificationsList.innerHTML = '';

    if (!notifications || notifications.length === 0) {
        notificationsList.innerHTML = '<p class="empty-state">No notifications yet</p>';
        return;
    }

    // Sort notifications by timestamp (newest first)
    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    notifications.forEach(notification => {
        const notificationEl = document.createElement('div');
        notificationEl.className = 'notification-item';
        if (notification.read) {
            notificationEl.style.opacity = '0.7';
        }
        notificationEl.innerHTML = `
            <p>${notification.message}</p>
            <p class="notification-match">Similarity: ${notification.similarity}%</p>
            <small>${formatDate(notification.timestamp)}</small>
        `;

        notificationEl.addEventListener('click', async () => {
            // Mark as read
            notification.read = true;
            notificationEl.style.opacity = '0.7';
            updateNotificationCount(notifications);

            // Show detailed modal with the matching listing
            try {
                const response = await fetch(`/api/listings/${notification.matchId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch listing details');
                }

                const matchingListing = await response.json();
                showMatchDetailsModal(notification, matchingListing);

            } catch (error) {
                console.error('Error loading listing details:', error);
                alert('Error loading match details. Please try again.');
            }
        });

        notificationsList.appendChild(notificationEl);
    });
}

// Update notification count
function updateNotificationCount(notifications) {
    if (!notifications) return;
    
    const unreadCount = notifications.filter(n => !n.read).length;
    notificationCount.textContent = unreadCount;
    
    if (unreadCount > 0) {
        notificationCount.style.display = 'inline-block';
        notificationCount.style.backgroundColor = 'var(--accent)';
        notificationCount.style.color = 'white';
        notificationCount.style.padding = '0.25rem 0.5rem';
        notificationCount.style.borderRadius = '10px';
    } else {
        notificationCount.style.display = 'none';
    }
}

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Function to show match details in a modal
function showMatchDetailsModal(notification, matchingListing) {
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

    // Modal content
    modal.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0; color: var(--primary);">Match Found!</h3>
                <button id="close-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">×</button>
            </div>
            
            <div style="margin-bottom: 1rem;">
                <p><strong>Similarity Score:</strong> <span style="color: var(--accent);">${notification.similarity}% match</span></p>
            </div>
            
            <div style="background: #f5f5f5; padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">
                <h4 style="margin: 0 0 0.5rem 0; color: var(--primary);">Matching Item Details</h4>
                <p><strong>Title:</strong> ${matchingListing.title}</p>
                <p><strong>Type:</strong> <span style="text-transform: capitalize;">${matchingListing.type}</span></p>
                <p><strong>Category:</strong> ${matchingListing.category}</p>
                <p><strong>Description:</strong> ${matchingListing.description}</p>
                <p><strong>Location:</strong> ${matchingListing.location}</p>
                <p><strong>Date:</strong> ${formatDate(matchingListing.date)}</p>
            </div>
            
            <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button id="contact-owner" style="padding: 0.5rem 1rem; background: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Contact Owner
                </button>
                <button id="close-modal-btn" style="padding: 0.5rem 1rem; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Close
                </button>
            </div>
        </div>
    `;

    // Add to document
    document.body.appendChild(modal);

    // Event listeners
    const closeModal = () => document.body.removeChild(modal);

    modal.querySelector('#close-modal').addEventListener('click', closeModal);
    modal.querySelector('#close-modal-btn').addEventListener('click', closeModal);
    modal.querySelector('#contact-owner').addEventListener('click', () => {
        alert('Contact feature would be implemented here!\n\nYou would be able to message the owner of this item.');
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

