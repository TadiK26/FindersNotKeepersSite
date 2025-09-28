from flask import jsonify,Blueprint
from flask_jwt_extended import jwt_required,get_jwt_identity
from extensions import db
from models import userModel
from functools import wraps

user_bp=Blueprint('user',__name__,url_prefix='/users')

#Decorator to allow owner access only
def owner_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        #current_user_id=int(get_jwt_identity())
        current_user_id=int(get_jwt_identity())
        try:
            current_user_id=int(current_user_id)
        except(TypeError, ValueError):
            return jsonify({"error":"Invalid token identity"}),401
        
        item_user_id=kwargs.get('userID')
        if (current_user_id!=item_user_id):
            return jsonify({"Error": "Access denied, you are not the owner!"}),403
        return fn(*args,**kwargs)
    return wrapper

#Get your own profile
@user_bp.route('/<int:userID>',methods=['GET'])
@jwt_required()
@owner_required
def get_user_profile(userID):
    user=db.session.get(userModel,userID)
    if not user:
        return jsonify({"Error":f"userModel with id {userID} not found"}), 404
    return jsonify({"id":user.userID,"username": user.username,"role":user.role})
