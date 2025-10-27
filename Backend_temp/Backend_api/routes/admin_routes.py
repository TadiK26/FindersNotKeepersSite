from flask import Blueprint, jsonify,request
from flask_jwt_extended import jwt_required,get_jwt_identity
from extensions import db
from models import userModel
from functools import wraps
from log_utils import create_report

admin_bp=Blueprint('admin',__name__,url_prefix='/admin')#blueprint for admin routes

#Decorator for admins
def admin_required(fn):
    @wraps(fn)
    def wrapper(*args,**kwargs):
        #currentUser_id=int(get_jwt_identity())#get the current user ID
        currentUser_id=int(get_jwt_identity())
        try:
            currentUser_id=int(currentUser_id)
        except(TypeError,ValueError):
            return jsonify({"error":"Invalid token identity"}),401

        user=db.session.get(userModel,currentUser_id)
        if not user or user.role!='admin':
            return jsonify({"Error":"Access denied, admins only!"}),403
        return fn(*args,**kwargs)
    return wrapper

#Admins have access to the list of all users
@admin_bp.route('/admin/users',methods=['GET'])
@jwt_required()
@admin_required
def get_all_users():
    users=userModel.query.all()
    return jsonify([{"id":u.userID,"username":u.username,"role":u.role} for u in users])

#Admins can delete users
@admin_bp.route('/admin/users/<int:userID>',methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(userID):
    user=db.session.get(userModel,userID)
    if not user:
        return jsonify({"Error":"userModel not found!"}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({"Message":f"{user.username} has been successfully deleted."}), 200

#Admins can generate reports
@admin_bp.route('/generate_report', methods=['POST'])
def generate_report():
    data = request.get_json()
    report = create_report(
        report_type=data.get("type"),
        content=data.get("content")
    )
    return jsonify({"message": "Report generated", "reportID": report.reportID}), 201