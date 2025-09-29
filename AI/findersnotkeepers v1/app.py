from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import json
import os
from datetime import datetime
from ai_services import calculate_semantic_similarity, generate_chatbot_response, track_unanswered_question
from geopy.distance import geodesic
import random

app = Flask(__name__)
app.secret_key = 'findersnotkeepers_secret_key_2025'

# In-memory data storage for demo (replace with database in production)
users_db = {}
listings_db = []
notifications_db = {}
unanswered_questions_db = []
search_settings_db = {}
next_id = 1000

# Sample test data
def initialize_sample_data():
    """Initialize the application with sample test data"""
    global listings_db, users_db
    
    # Sample users
    users_db = {
        'user1': {'password': 'pass123', 'name': 'John Doe', 'email': 'john@example.com', 'role': 'user'},
        'user2': {'password': 'pass123', 'name': 'Jane Smith', 'email': 'jane@example.com', 'role': 'user'},
        'admin1': {'password': 'admin123', 'name': 'Admin User', 'email': 'admin@example.com', 'role': 'admin'}
    }
    
    # Sample listings with realistic data
    sample_listings = [
        {
            'id': 1,
            'user_id': 'user1',
            'type': 'lost',
            'title': 'MacBook Pro 16-inch Space Gray',
            'description': 'Space Gray MacBook Pro with Touch Bar. Sticker of a mountain on the cover. Last used in the engineering building.',
            'category': 'electronics',
            'location': 'Engineering Building, 2nd Floor',
            'coordinates': {'lat': -25.754549, 'lng': 28.231447},
            'date': '2025-03-15',
            'image': 'default_laptop.jpg',
            'status': 'active',
            'created_at': '2025-03-15T10:30:00'
        },
        {
            'id': 2,
            'user_id': 'user2', 
            'type': 'found',
            'title': 'Silver iPhone with Black Case',
            'description': 'Found an iPhone in the library. It has a black protective case and a small scratch on the bottom.',
            'category': 'electronics',
            'location': 'Main Library, Study Room 3B',
            'coordinates': {'lat': -25.754549, 'lng': 28.231447},
            'date': '2025-03-15',
            'image': 'default_phone.jpg',
            'status': 'active',
            'created_at': '2025-03-15T14:20:00'
        },
        {
            'id': 3,
            'user_id': 'user1',
            'type': 'lost',
            'title': 'Blue North Face Jacket',
            'description': 'Dark blue North Face waterproof jacket. Size medium. Left pocket has a small tear.',
            'category': 'clothing',
            'location': 'Student Center Cafeteria',
            'coordinates': {'lat': -25.755000, 'lng': 28.232000},
            'date': '2025-03-14',
            'image': 'default_jacket.jpg',
            'status': 'active',
            'created_at': '2025-03-14T09:15:00'
        },
        {
            'id': 4,
            'user_id': 'user2',
            'type': 'found',
            'title': 'Student ID Card - John Smith',
            'description': 'Found student ID card near the library entrance. Name: John Smith, Student #: 12345678',
            'category': 'documents',
            'location': 'Library Main Entrance',
            'coordinates': {'lat': -25.754549, 'lng': 28.231447},
            'date': '2025-03-16',
            'image': 'default_id.jpg',
            'status': 'active',
            'created_at': '2025-03-16T11:45:00'
        },
        {
            'id': 5,
            'user_id': 'user1',
            'type': 'lost',
            'title': 'Wireless Sony Headphones',
            'description': 'Black Sony wireless headphones in a blue case. Model WH-1000XM4.',
            'category': 'electronics',
            'location': 'Sports Field Bleachers',
            'coordinates': {'lat': -25.756000, 'lng': 28.233000},
            'date': '2025-03-13',
            'image': 'default_headphones.jpg',
            'status': 'active',
            'created_at': '2025-03-13T16:30:00'
        }
    ]
    
    listings_db.extend(sample_listings)

@app.route('/')
def index():
    """Render the homepage"""
    return render_template('index.html', user=session.get('user'))

@app.route('/search')
def search_page():
    """Render the search page"""
    # Redirect to login if not authenticated for user-specific features
    if 'user' not in session and request.args.get('require_auth'):
        session['redirect_after_login'] = '/search'
        return redirect(url_for('login_page'))
    return render_template('search.html', user=session.get('user'))

@app.route('/login')
def login_page():
    """Render the login page"""
    return render_template('login.html')

@app.route('/api/login', methods=['POST'])
def login():
    """Handle user login"""
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    # Check if user exists and password matches
    if username in users_db and users_db[username]['password'] == password:
        session['user'] = {
            'username': username,
            'name': users_db[username]['name'],
            'email': users_db[username]['email'],
            'role': users_db[username]['role']
        }
        return jsonify({'success': True, 'user': session['user']})
    else:
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

@app.route('/api/logout')
def logout():
    """Handle user logout"""
    session.pop('user', None)
    return jsonify({'success': True})

@app.route('/api/listings', methods=['GET'])
def get_listings():
    """Get all active listings with optional filtering"""
    # Get filter parameters from request
    search_query = request.args.get('q', '')
    category = request.args.get('category', '')
    listing_type = request.args.get('type', '')
    location_filter = request.args.get('location', '')
    
    filtered_listings = listings_db.copy()
    
    # Apply text search filter
    if search_query:
        filtered_listings = [listing for listing in filtered_listings 
                           if search_query.lower() in listing['title'].lower() 
                           or search_query.lower() in listing['description'].lower()]
    
    # Apply category filter
    if category:
        filtered_listings = [listing for listing in filtered_listings 
                           if listing['category'] == category]
    
    # Apply type filter
    if listing_type:
        filtered_listings = [listing for listing in filtered_listings 
                           if listing['type'] == listing_type]
    
    # Apply location filter (simple text match for demo)
    if location_filter:
        filtered_listings = [listing for listing in filtered_listings 
                           if location_filter.lower() in listing['location'].lower()]
    
    return jsonify(filtered_listings)

@app.route('/api/listings', methods=['POST'])
def create_listing():
    """Create a new listing and trigger AI matching"""
    if 'user' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    data = request.json
    global next_id
    
    # Create new listing object
    new_listing = {
        'id': next_id,
        'user_id': session['user']['username'],
        'type': data.get('type'),
        'title': data.get('title'),
        'description': data.get('description'),
        'category': data.get('category'),
        'location': data.get('location'),
        'coordinates': {'lat': -25.754549, 'lng': 28.231447},  # Default coordinates for demo
        'date': data.get('date'),
        'image': data.get('image', 'default.jpg'),
        'status': 'active',
        'created_at': datetime.now().isoformat()
    }
    
    listings_db.append(new_listing)
    next_id += 1
    
    # Run AI matching in background (simulated)
    run_ai_matching(new_listing)
    
    return jsonify({'success': True, 'listing': new_listing})

@app.route('/api/search/advanced', methods=['POST'])
def advanced_search():
    """Perform advanced search with multiple criteria"""
    data = request.json
    
    # Get search criteria
    keywords = data.get('keywords', '')
    category = data.get('category', '')
    listing_type = data.get('type', '')
    location_radius = data.get('radius')  # in kilometers
    reference_location = data.get('reference_location')  # {lat, lng}
    
    filtered_listings = listings_db.copy()
    
    # Keyword search
    if keywords:
        filtered_listings = [listing for listing in filtered_listings 
                           if keywords.lower() in listing['title'].lower() 
                           or keywords.lower() in listing['description'].lower()]
    
    # Category filter
    if category:
        filtered_listings = [listing for listing in filtered_listings 
                           if listing['category'] == category]
    
    # Type filter  
    if listing_type:
        filtered_listings = [listing for listing in filtered_listings 
                           if listing['type'] == listing_type]
    
    # Location-based filtering
    if location_radius and reference_location:
        filtered_listings = filter_by_location(
            filtered_listings, 
            reference_location, 
            float(location_radius)
        )
    
    return jsonify(filtered_listings)

def filter_by_location(listings, reference_location, radius_km):
    """Filter listings by geographic proximity"""
    filtered = []
    for listing in listings:
        # Calculate distance between reference location and listing location
        listing_coords = (listing['coordinates']['lat'], listing['coordinates']['lng'])
        ref_coords = (reference_location['lat'], reference_location['lng'])
        
        distance = geodesic(listing_coords, ref_coords).kilometers
        
        if distance <= radius_km:
            filtered.append(listing)
    
    return filtered

def run_ai_matching(new_listing):
    """Run AI matching algorithm for new listing"""
    if 'user' not in session:
        return
    
    # Get user's similarity threshold preference
    user_threshold = session.get('similarity_threshold', 0.7)
    
    # Find potential matches (opposite type)
    potential_matches = [listing for listing in listings_db 
                        if listing['type'] != new_listing['type'] 
                        and listing['user_id'] != new_listing['user_id']]
    
    matches_found = []
    
    for match in potential_matches:
        # Calculate semantic similarity
        similarity_score = calculate_semantic_similarity(new_listing, match)
        
        if similarity_score >= user_threshold:
            matches_found.append({
                'listing': match,
                'similarity': similarity_score
            })
    
    # Create notifications for matches
    for match in matches_found:
        notification = {
            'id': len(notifications_db) + 1,
            'user_id': new_listing['user_id'],
            'type': 'match_found',
            'title': f'Potential Match Found!',
            'message': f'Your {new_listing["type"]} item matches a {match["listing"]["type"]} item with {match["similarity"]:.0%} similarity',
            'listing_id': new_listing['id'],
            'match_listing_id': match['listing']['id'],
            'similarity': match['similarity'],
            'timestamp': datetime.now().isoformat(),
            'read': False
        }
        
        # Store notification
        user_notifications = notifications_db.get(new_listing['user_id'], [])
        user_notifications.append(notification)
        notifications_db[new_listing['user_id']] = user_notifications

@app.route('/api/notifications')
def get_notifications():
    """Get user notifications"""
    if 'user' not in session:
        return jsonify([])
    
    user_notifications = notifications_db.get(session['user']['username'], [])
    return jsonify(user_notifications)

@app.route('/api/notifications/<int:notification_id>/read', methods=['POST'])
def mark_notification_read(notification_id):
    """Mark a notification as read"""
    if 'user' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    user_notifications = notifications_db.get(session['user']['username'], [])
    
    for notification in user_notifications:
        if notification['id'] == notification_id:
            notification['read'] = True
            break
    
    return jsonify({'success': True})

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chatbot conversations"""
    data = request.json
    user_message = data.get('message', '')
    conversation_history = data.get('history', [])
    
    # Generate chatbot response
    bot_response, is_answered = generate_chatbot_response(user_message, conversation_history)
    
    # Track unanswered questions for improvement
    if not is_answered:
        track_unanswered_question(user_message)
    
    # Update conversation history
    conversation_history.append({'role': 'user', 'content': user_message})
    conversation_history.append({'role': 'assistant', 'content': bot_response})
    
    return jsonify({
        'response': bot_response,
        'history': conversation_history,
        'is_answered': is_answered
    })

@app.route('/api/search/settings', methods=['POST'])
def save_search_settings():
    """Save user's search settings"""
    if 'user' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    data = request.json
    user_id = session['user']['username']
    
    search_settings_db[user_id] = data
    return jsonify({'success': True})

@app.route('/api/search/settings')
def get_search_settings():
    """Get user's saved search settings"""
    if 'user' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = session['user']['username']
    settings = search_settings_db.get(user_id, {})
    return jsonify(settings)

@app.route('/api/ai/threshold', methods=['POST'])
def update_ai_threshold():
    """Update user's AI similarity threshold"""
    if 'user' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    data = request.json
    threshold = data.get('threshold', 0.7)
    
    # Store in session (in production, store in user profile)
    session['similarity_threshold'] = threshold
    
    return jsonify({'success': True, 'threshold': threshold})

# Initialize sample data when app starts
with app.app_context():
    initialize_sample_data()

if __name__ == '__main__':
    app.run(debug=True, port=5000)