from flask import Blueprint, request, jsonify
from extensions import db
from models import Claims

claims_bp = Blueprint('claims', __name__, url_prefix='/claims')

# Create a claim
@claims_bp.route('', methods=['POST'])
def create_claim():
    data = request.json
    claim = Claims(
        listing_id=data['listing_id'],
        user_id=data['user_id'],
        message=data.get('message')
    )
    db.session.add(claim)
    db.session.commit()
    return jsonify({'message': 'Claim created', 'id': claim.id}), 201

# Get all claims for a user
# @claims_bp.route('/user/<int:user_id>', methods=['GET'])
# def get_claims(user_id):
#     claims = Claims.query.filter_by(user_id=user_id).all()
#     result = [
#         {
#             'id': c.id,
#             'listing_id': c.listing_id,
#             'message': c.message
#         } for c in claims
#     ]
#     return jsonify(result)

@claims_bp.route('/<int:user_id>', methods=['GET'])
def get_claims(user_id):
    claims = Claims.query.filter_by(user_id=user_id).all()
    result = [{'id': c.id, 'listing_id': c.listing_id, 'message': c.message} for c in claims]
    return jsonify(result)


# Get all claims for a listing
@claims_bp.route('/listing/<int:listing_id>', methods=['GET'])
def get_claims_for_listing(listing_id):
    claims = Claims.query.filter_by(listing_id=listing_id).all()
    result = [
        {
            'id': c.id,
            'user_id': c.user_id,
            'message': c.message
        } for c in claims
    ]
    return jsonify(result)
