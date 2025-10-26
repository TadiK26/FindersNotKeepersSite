import os
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db, jwt, revoke_token
from models import userModel,Listings,Notification
from sqlalchemy.exc import IntegrityError
from flask_jwt_extended import (
    get_jwt, create_access_token, create_refresh_token, jwt_required, get_jwt_identity
)
from itsdangerous import URLSafeTimedSerializer
from log_utils import log_audit
from user_session import start_user_session, clear_user_session
from flask import current_app
from werkzeug.utils import secure_filename
from auth import token_required
from datetime import datetime
import os

# Set upload folder relative to this file
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "../uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

# ----------------- JWT Token Revocation -----------------
@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload.get("jti")
    return jti in revoke_token

# ----------------- Serializer for password reset -----------------
def get_serializer():
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"])

# ----------------- REGISTER -----------------
@auth_bp.route('/register', methods=['POST'])
def register():
    userData = request.get_json() or {}
    email = userData.get('email')
    password = userData.get('password')
    role = userData.get('role', 'user')

    # Validate required fields
    if not email or not password:
        return jsonify({"Error": "Email and password are required."}), 400

    # Check uniqueness
    if userModel.query.filter_by(email=email).first():
        return jsonify({"Error": "Email already exists!"}), 409

    if role not in ['user', 'admin']:
        return jsonify({"Error": "Role must be 'user' or 'admin'."}), 400

    hashedPassword = generate_password_hash(password)
    newUser = userModel(email=email, password=hashedPassword, role=role)
    db.session.add(newUser)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"Error": "Failed to register user."}), 500

    return jsonify({"message": f"{email} registered successfully as {role}."}), 201

# ----------------- LOGIN -----------------
@auth_bp.route('/login', methods=['POST'])
def login():
    userData = request.get_json() or {}
    email = userData.get('email')
    password = userData.get('password')

    # Validate required fields
    if not email or not password:
        return jsonify({"Error": "Email and password are required."}), 400

    user = userModel.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"message": "Invalid email or password!"}), 401

    if not user.is_active:
        return jsonify({"message": "User is not active!"}), 403

    log_audit(
        userID=user.userID,
        action="LOGIN",
        details=f"IP: {request.remote_addr}, UA: {request.headers.get('User-Agent')}"
    )

    start_user_session(user)

    access_token = create_access_token(identity=str(user.userID), additional_claims={"role": user.role})
    refresh_token = create_refresh_token(identity=str(user.userID))

    return jsonify({
        "message": f"Welcome {user.email}!",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user_id": user.userID
    }), 200

# ----------------- REFRESH ACCESS TOKEN -----------------
@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    currentUser_id = int(get_jwt_identity())
    newAccess_token = create_access_token(identity=str(currentUser_id))
    return jsonify({"access_token": newAccess_token}), 200

# ----------------- PROTECTED ROUTE -----------------
@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    currentUser_id = int(get_jwt_identity())
    user = db.session.get(userModel, currentUser_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    return jsonify({
        "message": f"Hello, {user.email}, your role is {user.role} and your information is protected."
    }), 200

# ----------------- LOGOUT ACCESS TOKEN -----------------
@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout_access():
    jti = get_jwt()["jti"]
    user_id = int(get_jwt_identity())
    revoke_token.add(jti)

    clear_user_session()

    log_audit(
        userID=user_id,
        action="LOGOUT",
        details=f"Access token revoked from {request.remote_addr}"
    )
    return jsonify({"message": "Access token revoked, session ended successfully."}), 200

# ----------------- LOGOUT REFRESH TOKEN -----------------
@auth_bp.route('/logout_refresh', methods=['POST'])
@jwt_required(refresh=True)
def logout_refresh():
    jti = get_jwt()["jti"]
    revoke_token.add(jti)
    return jsonify({"message": "Refresh token has been revoked."}), 200


# ----------------- CHANGE PASSWORD -----------------
@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    current_user_id = int(get_jwt_identity())
    user = db.session.get(userModel, current_user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json() or {}
    current_password = data.get("current_password")
    new_password = data.get("new_password")

    # Validate inputs
    if not current_password or not new_password:
        return jsonify({"message": "Current and new password are required"}), 400

    if not check_password_hash(user.password, current_password):
        return jsonify({"message": "Current password is incorrect"}), 400

    # Update password
    user.password = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({"message": "Password updated successfully"}), 200


# ----------------- FORGOT PASSWORD -----------------
@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    userData = request.get_json() or {}
    email = userData.get("email")

    if not email:
        return jsonify({"error": "Email required"}), 400

    user = userModel.query.filter_by(email=email).first()
    if not user:
        return jsonify({"Error": "User not found!"}), 404

    serializer = get_serializer()
    user_token = serializer.dumps(user.email, salt="password-reset")
    reset_link = f"http://localhost:5000/reset-password/{user_token}"  # Normally sent via email
    return jsonify({"reset_link": reset_link}), 200

# ----------------- RESET PASSWORD -----------------
@auth_bp.route('/reset-password/<token>', methods=['POST'])
def reset_password(token):
    serializer = get_serializer()
    try:
        email = serializer.loads(token, salt="password-reset", max_age=3600)
    except Exception:
        return jsonify({"message": "Invalid or expired token"}), 400

    user = userModel.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json() or {}
    new_password = data.get("new_password")
    if not new_password:
        return jsonify({"message": "New password is required"}), 400

    user.password = generate_password_hash(new_password)
    db.session.commit()
    return jsonify({"message": "Password has been reset successfully"}), 200


# # Get logged-in user profile
# @auth_bp.route('/profile', methods=['GET'])
# @jwt_required()
# def get_profile():
#     current_user_id = int(get_jwt_identity())
#     user = db.session.get(userModel, current_user_id)
#     if not user:
#         return jsonify({"message": "User not found"}), 404

#     return jsonify({
#         "user_id": user.userID,
#         "email": user.email,
#         "role": user.role,
#         "is_active": user.is_active
#     }), 200

# @auth_bp.route('/profile', methods=['GET'])
# @jwt_required()
# def get_profile():
#     current_user_id = int(get_jwt_identity())
#     user = db.session.get(userModel, current_user_id)
#     if not user:
#         return jsonify({"message": "User not found"}), 404

#     return jsonify({
#         "user_id": user.userID,
#         "email": user.email,
#         "role": user.role,
#         "is_active": user.is_active
#     }), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = db.session.get(userModel, int(current_user_id)) if current_user_id else None
    if not user:
        return jsonify({"message": "User not found"}), 404

    # Construct full avatar URL if it exists
    avatar_full_url = f"{request.host_url.rstrip('/')}{user.avatar}" if user.avatar else ""

    return jsonify({
        "user_id": user.userID,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "avatar": avatar_full_url
    }), 200

# In auth_routes.py
@auth_bp.route("/all-listings", methods=["GET"])
def get_all_listings():
    listings = Listings.query.all()  # all listings
    result = []

    for l in listings:
        result.append({
            "id": l.id,
            "title": l.title,
            "description": l.description,
            "status": l.status,
            "where": l.where,
            "when": l.when.strftime("%Y-%m-%d"),
            "category_id": l.category_id,
            "contact_name": l.contact_name,
            "contact_email": l.contact_email,
            "contact_phone": l.contact_phone,
            "photo": l.photo
        })
    return jsonify(result), 200

@auth_bp.route("/listings", methods=["GET"])
@jwt_required()
def get_my_listings():
    user_id = int(get_jwt_identity())
    status = request.args.get("status")  # optional: LOST, FOUND, RETURNED
    query = Listings.query.filter_by(user_id=user_id)
    if status:
        query = query.filter_by(status=status.upper())
    listings = query.all()

    result = []
    for l in listings:
        result.append({
            "id": l.id,
            "title": l.title,
            "description": l.description,
            "status": l.status,
            "where": l.where,
            "when": l.when.strftime("%Y-%m-%d"),
            "category_id": l.category_id,
            "contact_name": l.contact_name,
            "contact_email": l.contact_email,
            "contact_phone": l.contact_phone,
            "photo": l.photo
        })
    
    return jsonify(result), 200

@auth_bp.route("/listings", methods=["POST"])
@jwt_required()
def create_listing():
    user_id = int(get_jwt_identity())
    user = db.session.get(userModel, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Use form data to handle file upload
    data = request.form
    title = data.get("title")
    status = data.get("status", "LOST").upper()
    where = data.get("where")
    when = data.get("when")  # Expecting yyyy-mm-dd
    category_id = data.get("categoryId")
    description = data.get("description", "")
    contact_name = data.get("contactName")
    contact_email = data.get("contactEmail")
    contact_phone = data.get("contactPhone", "")

    # Basic validation
    if not title or not status or not where or not when or not category_id or not contact_name or not contact_email:
        return jsonify({"error": "Missing required fields"}), 400

    # Optional image upload
    photo_url = ""
    if "photo" in request.files:
        file = request.files["photo"]
        if file and allowed_file(file.filename):
            filename = secure_filename(f"listing_{user_id}_{file.filename}")
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
            photo_url = f"/uploads/{filename}"

    # Save to DB
    listing = Listings(
        user_id=user_id,
        title=title,
        status=status,
        where=where,
        when=datetime.strptime(when, "%Y-%m-%d").date(),
        category_id=int(category_id),
        description=description,
        contact_name=contact_name,
        contact_email=contact_email,
        contact_phone=contact_phone,
        photo=photo_url
    )
    db.session.add(listing)
    db.session.commit()
    notification = Notification(
        user_id=user_id,
        title=f"{title} {status}",
        body=f"Your listing '{title}' has been marked as {status}.",
        unread=True,
        listing_id=listing.id   # 👈 Add this line
    )

    db.session.add(notification)
    db.session.commit()

    return jsonify({"message": "Listing created!", "listing_id": listing.id}), 201



ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
@auth_bp.route('/upload-avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    current_user_id = get_jwt_identity()
    user = db.session.get(userModel, int(current_user_id))
    if not user:
        return jsonify({"error": "User not found"}), 404

    if 'avatar' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['avatar']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(f"user_{user.userID}_{file.filename}")
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        # Save path relative to server root
        user.avatar = f"/uploads/{filename}"
        db.session.commit()

        # Return full URL including host and timestamp to bust cache
        avatar_full_url = f"{request.host_url.rstrip('/')}{user.avatar}?t={int(datetime.utcnow().timestamp())}"
        return jsonify({"avatar": avatar_full_url}), 200

    return jsonify({"error": "Invalid file type"}), 400


# @auth_bp.route("/uploads/<filename>")
# def uploaded_file(filename):
#     return send_from_directory(UPLOAD_FOLDER, filename)


@auth_bp.route('/update-preferences', methods=['POST'])
@jwt_required()
def update_preferences():
    current_user_id = int(get_jwt_identity())
    user = db.session.get(userModel, current_user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json() or {}

    # Update preferences (make sure your userModel has these columns)
    user.email_notif = data.get("email_notif", user.email_notif)
    user.sms_notif = data.get("sms_notif", user.sms_notif)
    user.push_notif = data.get("push_notif", user.push_notif)
    user.show_profile = data.get("show_profile", user.show_profile)
    user.allow_messages = data.get("allow_messages", user.allow_messages)
    user.share_location = data.get("share_location", user.share_location)

    db.session.commit()

    return jsonify({"message": "Preferences updated successfully"}), 200

@auth_bp.route("/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    user_id = int(get_jwt_identity())

    # Fetch notifications for this user
    notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.id.desc()).all()

    if not notifications:
        return jsonify([]), 200  # Empty array for no notifications

    result = []
    for n in notifications:
        result.append({
            "id": n.id,
            "title": n.title,
            "body": n.body,
            "unread": n.unread,
            "listing_id": n.listing_id,  # 👈 Add this line
            "at": n.created_at.strftime("%d %b %Y • %H:%M") if hasattr(n, "created_at") and n.created_at else "",
        })


    return jsonify(result), 200
