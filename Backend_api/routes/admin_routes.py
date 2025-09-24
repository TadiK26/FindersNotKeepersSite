from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required,get_jwt_identity
from extensions import db
from models import User
from functools import wraps

admin_bp=Blueprint('admin',__name__,url_prefix='/admin')

# Admin-only decorator,
def admin_required(fn):
    @wraps(fn)
    def wrapper(*args,**kwargs):
        #currentUser_id=int(get_jwt_identity())#get the current user ID
        currentUser_id=int(get_jwt_identity())
        try:
            currentUser_id=int(currentUser_id)
        except(TypeError,ValueError):
            return jsonify({"error":"Invalid token identity"}),401

        user=db.session.get(User,currentUser_id)
        if not user or user.role!='admin':
            return jsonify({"Error":"Access denied, admins only!"}),403
        return fn(*args,**kwargs)
    return wrapper

#Admins have access to the list of all users
@admin_bp.route('/admin/users',methods=['GET'])
@jwt_required()
@admin_required
def get_all_users():
    users=User.query.all()
    return jsonify([{"id":u.user_id,"username":u.username,"role":u.role} for u in users])

#Admins can delete users
@admin_bp.route('/admin/users/<int:user_id>',methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(user_id):
    user=db.session.get(User,user_id)
    if not user:
        return jsonify({"Error":"User not found!"}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({"Message":f"{user.username} has been successfully deleted."}), 200