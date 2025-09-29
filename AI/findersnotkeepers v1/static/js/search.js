/**
 * Search Page JavaScript for FindersNotKeepers
 * Handles search functionality, filters, and location-based searching
 */

// Global variables
let currentSearchResults = [];
let map = null;
let userLocation = null;

/**
 * Initialize the search page when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeSearchPage();
    loadSavedSearchSettings();
    setupEventListeners();
});

/**
 * Initialize search page components
 */
function initializeSearchPage() {
    // Load initial listings
    performSearch();

    // Initialize map placeholder (would integrate with Google Maps API)
    initializeMapPlaceholder();

    // Check if user is logged in for personalized features
    checkUserAuthentication();
}

/**
 * Set up all event listeners for search page
 */
function setupEventListeners() {
    // Search form submission
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            performSearch();
        });
    }

    // Advanced search button
    const advancedSearchBtn = document.getElementById('advanced-search-btn');
    if (advancedSearchBtn) {
        advancedSearchBtn.addEventListener('click', performAdvancedSearch);
    }

    // Save settings button
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSearchSettings);
    }

    // Reset filters button
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetSearchFilters);
    }

    // Use current location button
    const useLocationBtn = document.getElementById('use-location-btn');
    if (useLocationBtn) {
        useLocationBtn.addEventListener('click', getCurrentLocation);
    }

    // AI threshold slider
    const thresholdSlider = document.getElementById('similarity-threshold');
    if (thresholdSlider) {
        thresholdSlider.addEventListener('input', updateAIThreshold);
    }
}

/**
 * Perform basic search with current filter values
 */
async function performSearch() {
    try {
        showLoadingState(true);

        // Get search parameters from form
        const searchParams = getSearchParameters();

        // Build query string
        const queryParams = new URLSearchParams();
        if (searchParams.keywords) queryParams.append('q', searchParams.keywords);
        if (searchParams.category) queryParams.append('category', searchParams.category);
        if (searchParams.type) queryParams.append('type', searchParams.type);
        if (searchParams.location) queryParams.append('location', searchParams.location);

        // Make API request
        const response = await fetch(`/api/listings?${queryParams}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const results = await response.json();
        currentSearchResults = results;

        // Display results
        displaySearchResults(results);

    } catch (error) {
        console.error('Error performing search:', error);
        showError('Failed to perform search. Please try again.');
    } finally {
        showLoadingState(false);
    }
}

/**
 * Perform advanced search with additional criteria
 */
async function performAdvancedSearch() {
    try {
        showLoadingState(true);

        // Get advanced search parameters
        const searchParams = getAdvancedSearchParameters();

        // Validate that at least one search criteria is provided
        if (!searchParams.keywords && !searchParams.category && !searchParams.type && !searchParams.radius) {
            showError('Please provide at least one search criteria');
            return;
        }

        // Make API request for advanced search
        const response = await fetch('/api/search/advanced', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(searchParams)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const results = await response.json();
        currentSearchResults = results;

        // Display results
        displaySearchResults(results);

    } catch (error) {
        console.error('Error performing advanced search:', error);
        showError('Failed to perform advanced search. Please try again.');
    } finally {
        showLoadingState(false);
    }
}

/**
 * Get basic search parameters from form
 * @returns {Object} Search parameters object
 */
function getSearchParameters() {
    return {
        keywords: document.getElementById('keywords').value.trim(),
        category: document.getElementById('category').value,
        type: document.getElementById('type').value,
        location: document.getElementById('location').value.trim()
    };
}

/**
 * Get advanced search parameters from form
 * @returns {Object} Advanced search parameters object
 */
function getAdvancedSearchParameters() {
    const params = getSearchParameters();

    // Add advanced parameters
    const radius = document.getElementById('search-radius').value;
    const useCurrentLocation = document.getElementById('use-current-location').checked;

    if (radius && useCurrentLocation && userLocation) {
        params.radius = radius;
        params.reference_location = userLocation;
    }

    return params;
}

/**
 * Display search results in the results container
 * @param {Array} results - Array of listing objects
 */
function displaySearchResults(results) {
    const resultsContainer = document.getElementById('results-container');
    const resultsCount = document.getElementById('results-count');

    if (!resultsContainer) return;

    // Update results count
    if (resultsCount) {
        resultsCount.textContent = `Found ${results.length} item${results.length !== 1 ? 's' : ''}`;
    }

    // Clear previous results
    resultsContainer.innerHTML = '';

    // Handle empty results
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <h3>No items found</h3>
                <p>Try adjusting your search criteria or browse all listings</p>
            </div>
        `;
        return;
    }

    // Create and append result cards
    results.forEach(listing => {
        const listingCard = createListingCard(listing);
        resultsContainer.appendChild(listingCard);
    });
}

/**
 * Create a listing card element
 * @param {Object} listing - Listing data object
 * @returns {HTMLElement} Listing card element
 */
function createListingCard(listing) {
    const card = document.createElement('div');
    card.className = 'listing-card';
    card.innerHTML = `
        <div class="card-img">
            <img src="${listing.image || 'default.jpg'}" alt="${listing.title}" width="300" height="200">
        </div>
        <div class="card-content">
            <h3 class="card-title">${escapeHtml(listing.title)}</h3>
            <div class="card-details">
                <p>${escapeHtml(listing.description)}</p>
                <p><strong>Location:</strong> ${escapeHtml(listing.location)}</p>
                <p><strong>Date:</strong> ${formatDate(listing.date)}</p>
                <p><strong>Category:</strong> ${escapeHtml(listing.category)}</p>
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
 * View detailed information about a listing
 * @param {Object} listing - Listing data object
 */
function viewListingDetails(listing) {
    // In a full implementation, this would open a modal or navigate to detail page
    alert(`Listing Details:\n\nTitle: ${listing.title}\nType: ${listing.type}\nCategory: ${listing.category}\nLocation: ${listing.location}\nDate: ${listing.date}\nDescription: ${listing.description}`);
}

/**
 * Save current search settings for the user
 */
async function saveSearchSettings() {
    try {
        const settings = getAdvancedSearchParameters();

        const response = await fetch('/api/search/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });

        if (response.ok) {
            showSuccess('Search settings saved successfully!');
        } else if (response.status === 401) {
            showError('Please log in to save search settings');
        } else {
            throw new Error('Failed to save settings');
        }
    } catch (error) {
        console.error('Error saving search settings:', error);
        showError('Failed to save search settings');
    }
}

/**
 * Load user's saved search settings
 */
async function loadSavedSearchSettings() {
    try {
        const response = await fetch('/api/search/settings');

        if (response.ok) {
            const settings = await response.json();
            applySearchSettings(settings);
        }
        // If not logged in (401), settings won't be loaded - this is fine
    } catch (error) {
        console.error('Error loading search settings:', error);
    }
}

/**
 * Apply saved search settings to the form
 * @param {Object} settings - Saved search settings object
 */
function applySearchSettings(settings) {
    if (settings.keywords) document.getElementById('keywords').value = settings.keywords;
    if (settings.category) document.getElementById('category').value = settings.category;
    if (settings.type) document.getElementById('type').value = settings.type;
    if (settings.location) document.getElementById('location').value = settings.location;
    if (settings.radius) document.getElementById('search-radius').value = settings.radius;
}

/**
 * Reset all search filters to default values
 */
function resetSearchFilters() {
    document.getElementById('keywords').value = '';
    document.getElementById('category').value = '';
    document.getElementById('type').value = '';
    document.getElementById('location').value = '';
    document.getElementById('search-radius').value = '5';
    document.getElementById('use-current-location').checked = false;

    // Perform new search with reset filters
    performSearch();
}

/**
 * Get user's current location using geolocation API
 */
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by this browser');
        return;
    }

    showLoadingState(true, 'Getting your location...');

    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            // Update location field with coordinates
            document.getElementById('location').value = `Near your location (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})`;
            document.getElementById('use-current-location').checked = true;

            showSuccess('Location detected successfully!');
            showLoadingState(false);
        },
        (error) => {
            console.error('Error getting location:', error);
            showError('Unable to get your location. Please enter location manually.');
            showLoadingState(false);
        }
    );
}

/**
 * Update AI similarity threshold preference
 */
async function updateAIThreshold() {
    const thresholdSlider = document.getElementById('similarity-threshold');
    const thresholdValue = document.getElementById('threshold-value');

    if (!thresholdSlider || !thresholdValue) return;

    const threshold = parseFloat(thresholdSlider.value) / 100;
    thresholdValue.textContent = `${thresholdSlider.value}%`;

    try {
        const response = await fetch('/api/ai/threshold', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ threshold: threshold })
        });

        if (!response.ok) {
            throw new Error('Failed to update threshold');
        }

        console.log('AI threshold updated to:', threshold);
    } catch (error) {
        console.error('Error updating AI threshold:', error);
    }
}

/**
 * Initialize map placeholder (would integrate with Google Maps API in production)
 */
function initializeMapPlaceholder() {
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🗺️</div>
                <h3>Map View</h3>
                <p>Interactive map would be displayed here</p>
                <p><small>Google Maps integration for location-based searching</small></p>
            </div>
        `;
    }
}

/**
 * Check if user is authenticated and update UI accordingly
 */
function checkUserAuthentication() {
    // This would check session or make API call to verify authentication
    // For demo, we'll assume we can check a global variable or make a simple API call
    const userElements = document.querySelectorAll('.user-only');
    const publicElements = document.querySelectorAll('.public-only');

    // Simple check - in real app, this would be more robust
    const isLoggedIn = document.body.classList.contains('user-logged-in');

    userElements.forEach(el => {
        el.style.display = isLoggedIn ? 'block' : 'none';
    });

    publicElements.forEach(el => {
        el.style.display = isLoggedIn ? 'none' : 'block';
    });
}

/**
 * Show loading state for search operations
 * @param {boolean} isLoading - Whether to show loading state
 * @param {string} message - Optional loading message
 */
function showLoadingState(isLoading, message = 'Searching...') {
    const searchButton = document.querySelector('#search-form button[type="submit"]');
    const resultsContainer = document.getElementById('results-container');

    if (isLoading) {
        document.body.classList.add('loading');
        if (searchButton) {
            searchButton.innerHTML = `<span class="spinner"></span> ${message}`;
            searchButton.disabled = true;
        }
        if (resultsContainer) {
            resultsContainer.innerHTML = `<div class="empty-state">${message}</div>`;
        }
    } else {
        document.body.classList.remove('loading');
        if (searchButton) {
            searchButton.textContent = 'Search';
            searchButton.disabled = false;
        }
    }
}

/**
 * Show error message to user
 * @param {string} message - Error message to display
 */
function showError(message) {
    // Simple error display - could be enhanced with a proper notification system
    alert(`Error: ${message}`);
}

/**
 * Show success message to user
 * @param {string} message - Success message to display
 */
function showSuccess(message) {
    // Simple success display - could be enhanced with a proper notification system
    alert(`Success: ${message}`);
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
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getSearchParameters,
        getAdvancedSearchParameters,
        formatDate,
        escapeHtml
    };
}