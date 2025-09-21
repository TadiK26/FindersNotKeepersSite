from flask import Flask, render_template, request, jsonify
from ai_services import calculate_similarity, generate_chatbot_response
import json
import os
from datetime import datetime

app = Flask(__name__)

# Sample data for initial listings
sample_listings = [
    # Electronics - Lost
    {
        "id": 101,
        "type": "lost",
        "title": "iPhone 13 Pro Max",
        "description": "Silver iPhone 13 Pro Max with black case. Has a small scratch on the bottom right corner. Lost on campus.",
        "category": "electronics",
        "location": "Main Library, Study Room 3B",
        "date": "2025-03-15",
        "image": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='300' height='200' fill='%23cccccc'/><text x='150' y='100' font-family='Arial' font-size='20' text-anchor='middle' fill='%23666666'>iPhone Image</text></svg>"
    },
    {
        "id": 102,
        "type": "lost",
        "title": "MacBook Pro 16-inch",
        "description": "Space Gray MacBook Pro with Touch Bar. Sticker of a mountain on the cover. Last used in the engineering building.",
        "category": "electronics",
        "location": "Engineering Building, 2nd Floor",
        "date": "2025-03-12",
        "image": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='300' height='200' fill='%23cccccc'/><text x='150' y='100' font-family='Arial' font-size='20' text-anchor='middle' fill='%23666666'>MacBook Image</text></svg>"
    },
    # Electronics - Found
    {
        "id": 201,
        "type": "found",
        "title": "Silver iPhone with black case",
        "description": "Found an iPhone in the library. It has a black protective case and a small scratch on the bottom.",
        "category": "electronics",
        "location": "Main Library, near study rooms",
        "date": "2025-03-15",
        "image": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='300' height='200' fill='%23cccccc'/><text x='150' y='100' font-family='Arial' font-size='20' text-anchor='middle' fill='%23666666'>Found iPhone</text></svg>"
    },
    {
        "id": 202,
        "type": "found",
        "title": "Laptop found in engineering building",
        "description": "Gray MacBook Pro found on a desk in the engineering building. Has a sticker on it.",
        "category": "electronics",
        "location": "Engineering Building, 2nd Floor Lounge",
        "date": "2025-03-12",
        "image": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='300' height='200' fill='%23cccccc'/><text x='150' y='100' font-family='Arial' font-size='20' text-anchor='middle' fill='%23666666'>Found Laptop</text></svg>"
    },
    # Clothing - Lost
    {
        "id": 104,
        "type": "lost",
        "title": "Blue North Face Jacket",
        "description": "Dark blue North Face waterproof jacket. Size medium. Left pocket has a small tear. Lost at the cafeteria.",
        "category": "clothing",
        "location": "Student Center Cafeteria",
        "date": "2025-03-10",
        "image": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='300' height='200' fill='%23cccccc'/><text x='150' y='100' font-family='Arial' font-size='20' text-anchor='middle' fill='%23666666'>Jacket Image</text></svg>"
    },
    # Clothing - Found
    {
        "id": 204,
        "type": "found",
        "title": "Blue jacket in cafeteria",
        "description": "Found a blue North Face jacket in the student cafeteria. It seems to be waterproof.",
        "category": "clothing",
        "location": "Student Center Dining Area",
        "date": "2025-03-10",
        "image": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='300' height='200' fill='%23cccccc'/><text x='150' y='100' font-family='Arial' font-size='20' text-anchor='middle' fill='%23666666'>Found Jacket</text></svg>"
    },
    # Documents - Lost
    {
        "id": 106,
        "type": "lost",
        "title": "Student ID and Wallet",
        "description": "Brown leather wallet containing student ID, credit cards, and some cash. Lost somewhere on campus.",
        "category": "documents",
        "location": "Campus Grounds",
        "date": "2025-03-11",
        "image": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='300' height='200' fill='%23cccccc'/><text x='150' y='100' font-family='Arial' font-size='20' text-anchor='middle' fill='%23666666'>Wallet Image</text></svg>"
    },
    # Documents - Found
    {
        "id": 206,
        "type": "found",
        "title": "Wallet found near library",
        "description": "Found a brown leather wallet with student ID and cards inside. Found on a bench.",
        "category": "documents",
        "location": "Outside Main Library",
        "date": "2025-03-11",
        "image": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='300' height='200' fill='%23cccccc'/><text x='150' y='100' font-family='Arial' font-size='20' text-anchor='middle' fill='%23666666'>Found Wallet</text></svg>"
    }
]

# In-memory data storage for demo
listings = sample_listings.copy()
notifications = []
next_id = 300  # Start from an ID higher than our sample data


# Add this function to your app.py
# In app.py, enhance the run_ai_matching function
def run_ai_matching(new_listing):
    threshold = 0.5  # Similarity threshold (50%)

    print(f"\n=== RUNNING AI MATCHING FOR NEW LISTING ===")
    print(f"New listing: {new_listing['title']} ({new_listing['type']})")

    # Find potential matches (opposite type)
    potential_matches = [item for item in listings if
                         item['type'] != new_listing['type'] and item['id'] != new_listing['id']]

    print(f"Found {len(potential_matches)} potential matches to check")

    # Calculate similarity for each potential match
    matches_found = 0
    for match in potential_matches:
        similarity = calculate_similarity(new_listing, match)

        if similarity >= threshold:
            print(f"MATCH FOUND! Similarity: {similarity * 100:.1f}%")
            # Create a notification
            notification = {
                "id": len(notifications) + 1,
                "message": f"Potential match found for your {new_listing['type']} item!",
                "listingId": new_listing['id'],
                "matchId": match['id'],
                "similarity": round(similarity * 100),
                "timestamp": datetime.now().isoformat(),
                "read": False
            }

            notifications.append(notification)
            matches_found += 1
            print(f"Notification #{matches_found} created: {notification}")
        else:
            print(f"No match: {similarity * 100:.1f}% < {threshold * 100}% threshold")

    print(f"=== AI MATCHING COMPLETE: {matches_found} matches found ===\n")

@app.route('/')
def index():
    return render_template('index.html')

# Modify your handle_listings function to call this:
@app.route('/api/listings', methods=['GET', 'POST'])
def handle_listings():
    global next_id

    if request.method == 'GET':
        return jsonify(listings)
    else:
        new_listing = request.json
        new_listing['id'] = next_id
        next_id += 1

        # Add a default image if not provided
        if 'image' not in new_listing:
            new_listing[
                'image'] = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='300' height='200' fill='%23cccccc'/><text x='150' y='100' font-family='Arial' font-size='20' text-anchor='middle' fill='%23666666'>Item Image</text></svg>"

        # Run AI matching FIRST (could be causing notifications problems)
        run_ai_matching(new_listing)

        # THEN add to listings
        listings.append(new_listing)

        return jsonify({"success": True, "id": new_listing['id']})

@app.route('/api/listings/<int:listing_id>')
def get_listing(listing_id):
    """Get a specific listing by ID"""
    listing = next((item for item in listings if item['id'] == listing_id), None)
    if listing:
        return jsonify(listing)
    return jsonify({"error": "Listing not found"}), 404

# In app.py, check your notifications endpoint
@app.route('/api/notifications')
def get_notifications():
    print(f"Returning {len(notifications)} notifications")
    for i, notification in enumerate(notifications):
        print(f"Notification {i}: {notification}")
    return jsonify(notifications)

@app.route('/api/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message', '')
    response = generate_chatbot_response(user_message)
    return jsonify({"response": response})


def run_ai_matching(new_listing):
    threshold = 0.5  # Reduced threshold for better matching in demo

    print(f"\n=== RUNNING AI MATCHING FOR NEW LISTING ===")
    print(f"New listing: {new_listing['title']} ({new_listing['type']})")
    print(f"Description: {new_listing['description']}")

    # Find potential matches (opposite type)
    potential_matches = [item for item in listings if item['type'] != new_listing['type']]

    print(f"Found {len(potential_matches)} potential matches to check")

    # Calculate similarity for each potential match
    matches_found = 0
    for match in potential_matches:
        similarity = calculate_similarity(new_listing, match)
        print(f"Comparing with '{match['title']}': {similarity * 100:.1f}%")

        if similarity >= threshold:
            print(f"✅ MATCH FOUND! Similarity: {similarity * 100:.1f}%")
            # Create a notification
            notification = {
                "id": len(notifications) + 1,
                "message": f"Potential match found for your {new_listing['type']} item '{new_listing['title']}'!",
                "listingId": new_listing['id'],
                "matchId": match['id'],
                "similarity": round(similarity * 100),
                "timestamp": datetime.now().isoformat(),
                "read": False
            }

            notifications.append(notification)
            matches_found += 1
            print(f"Notification created: {notification['message']}")
        else:
            print(f"❌ No match: {similarity * 100:.1f}% < {threshold * 100}% threshold")

    print(f"=== AI MATCHING COMPLETE: {matches_found} matches found ===\n")

if __name__ == '__main__':
    app.run(debug=True, port=5000)