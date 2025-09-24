from flask import jsonify,Blueprint
from flask_jwt_extended import jwt_required,get_jwt_identity
from extensions import db
from models import User
from functools import wraps

user_bp=Blueprint('user',__name__,url_prefix='/users')

# Decorator to allow owner access only
def owner_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        #current_user_id=int(get_jwt_identity())
        current_user_id=int(get_jwt_identity())
        try:
            current_user_id=int(current_user_id)
        except(TypeError, ValueError):
            return jsonify({"error":"Invalid token identity"}),401
        
        item_user_id=kwargs.get('user_id')
        if (current_user_id!=item_user_id):
            return jsonify({"Error": "Access denied, you are not the owner!"}),403
        return fn(*args,**kwargs)
    return wrapper

#Get own profile
@user_bp.route('/<int:user_id>',methods=['GET'])
@jwt_required()
@owner_required
def get_user_profile(user_id):
    user=db.session.get(User,user_id)
    if not user:
        return jsonify({"Error":f"User with id {user_id} not found"}), 404
    return jsonify({"id":user.user_id,"username": user.username,"role":user.role})
