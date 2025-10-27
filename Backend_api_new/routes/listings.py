from flask import Blueprint, request, jsonify
from extensions import db
from models import Listings, userModel

listings_bp = Blueprint('listings', __name__, url_prefix='/listings')

# Create a new listing
@listings_bp.route('/', methods=['POST'])
def create_listing():
    data = request.json
    
    # Validate required fields
    if not data.get('title') or not data.get('user_id'):
        return jsonify({"error": "Missing required fields: title or user_id"}), 400

    # Check if user exists
    user = userModel.query.get(data['user_id'])
    if not user:
        return jsonify({"error": "User not found"}), 404

    new_listing = Listings(
        title=data['title'],
        description=data.get('description', ''),
        user_id=data['user_id']
    )
    
    db.session.add(new_listing)
    db.session.commit()
    
    return jsonify({'message': 'Listing created', 'id': new_listing.id}), 201

# Get all listings
@listings_bp.route('/', methods=['GET'])
def get_all_listings():
    listings = Listings.query.all()
    results = []
    for l in listings:
        results.append({
            'id': l.id,
            'title': l.title,
            'description': l.description,
            'user_id': l.user_id
        })
    return jsonify(results), 200

# Get a single listing by ID
@listings_bp.route('/<int:id>', methods=['GET'])
def get_listing(id):
    listing = Listings.query.get_or_404(id)
    return jsonify({
        'id': listing.id,
        'title': listing.title,
        'description': listing.description,
        'user_id': listing.user_id
    }), 200

# Update a listing
@listings_bp.route('/<int:id>', methods=['PUT'])
def update_listing(id):
    listing = Listings.query.get_or_404(id)
    data = request.json
    listing.title = data.get('title', listing.title)
    listing.description = data.get('description', listing.description)
    db.session.commit()
    return jsonify({'message': 'Listing updated'}), 200

# Delete a listing
@listings_bp.route('/<int:id>', methods=['DELETE'])
def delete_listing(id):
    listing = Listings.query.get_or_404(id)
    db.session.delete(listing)
    db.session.commit()
    return jsonify({'message': 'Listing deleted'}), 200
