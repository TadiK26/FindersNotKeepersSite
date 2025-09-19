from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from functools import wraps
from itsdangerous import URLSafeTimedSerializer

# ------------------------------
# App & Config
# ------------------------------
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'super-secret-key'  # JWT secret
app.config['SECRET_KEY'] = app.config['JWT_SECRET_KEY']  # For URLSafeTimedSerializer

# Token lifetimes
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)  # slightly longer for testing
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)

# ------------------------------
# DB & JWT Setup
# ------------------------------
db = SQLAlchemy(app)
jwt = JWTManager(app)

# In-memory token blacklist
token_blacklist = set()

# ------------------------------
# User Model
# ------------------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(10), nullable=False, default='user')  # 'user' or 'admin'
    is_active = db.Column(db.Boolean, default=True)

with app.app_context():
    db.create_all()

# ------------------------------
# Role Decorators
# ------------------------------
def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        current_user_id = int(get_jwt_identity())
        user = db.session.get(User, current_user_id)
        if not user or user.role != 'admin':
            return jsonify({"message": "Admins only!"}), 403
        return fn(*args, **kwargs)
    return wrapper

def owner_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        current_user_id = int(get_jwt_identity())
        resource_user_id = kwargs.get('user_id')
        if current_user_id != resource_user_id:
            return jsonify({"message": "Access denied! Not the owner."}), 403
        return fn(*args, **kwargs)
    return wrapper

# ------------------------------
# JWT Token Blacklist Check
# ------------------------------
@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    return jwt_payload["jti"] in token_blacklist

# ------------------------------
# Registration
# ------------------------------
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'user')

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Username already exists"}), 400

    if role not in ['user', 'admin']:
        return jsonify({"message": "Role must be 'user' or 'admin'"}), 400

    new_user = User(
        username=username,
        password=generate_password_hash(password),
        role=role
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': f"User '{username}' registered successfully as {role}"}), 201

# ------------------------------
# Login
# ------------------------------
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"message": "Invalid username or password"}), 401

    if not user.is_active:
        return jsonify({"message": "User is inactive"}), 403

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token
    }), 200

# ------------------------------
# Token Refresh
# ------------------------------
@app.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user_id)
    return jsonify({"access_token": new_access_token}), 200

# ------------------------------
# Protected Route
# ------------------------------
@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user_id = int(get_jwt_identity())
    user = db.session.get(User, current_user_id)
    return jsonify({"message": f"Hello, {user.username}! Role: {user.role}"}), 200

# ------------------------------
# Admin Routes
# ------------------------------
@app.route('/admin/users', methods=['GET'])
@jwt_required()
@admin_required
def get_all_users():
    users = User.query.all()
    return jsonify([{"id": u.id, "username": u.username, "role": u.role} for u in users])

@app.route('/admin/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": f"User {user.username} deleted"}), 200

# ------------------------------
# Owner Routes
# ------------------------------
@app.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
@owner_required
def get_user_profile(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    return jsonify({"id": user.id, "username": user.username, "role": user.role})

# ------------------------------
# Logout Tokens
# ------------------------------
@app.route('/logout', methods=['POST'])
@jwt_required()
def logout_access():
    jti = get_jwt()["jti"]
    token_blacklist.add(jti)
    return jsonify({"message": "Access token revoked"}), 200

@app.route('/logout_refresh', methods=['POST'])
@jwt_required(refresh=True)
def logout_refresh():
    jti = get_jwt()["jti"]
    token_blacklist.add(jti)
    return jsonify({"message": "Refresh token revoked"}), 200

# ------------------------------
# Forgot & Reset Password
# ------------------------------
serializer = URLSafeTimedSerializer(app.config["SECRET_KEY"])

@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    username = data.get("username")
    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    token = serializer.dumps(user.username, salt="password-reset")
    reset_link = f"http://localhost:5000/reset-password/{token}"
    return jsonify({"reset_link": reset_link}), 200

@app.route('/reset-password/<token>', methods=['POST'])
def reset_password(token):
    try:
        username = serializer.loads(token, salt="password-reset", max_age=3600)
    except Exception:
        return jsonify({"message": "Invalid or expired token"}), 400

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json()
    new_password = data.get("new_password")
    if not new_password:
        return jsonify({"message": "New password is required"}), 400

    user.password = generate_password_hash(new_password)
    db.session.commit()
    return jsonify({"message": "Password has been reset successfully"}), 200

# ------------------------------
# Run App
# ------------------------------
if __name__ == '__main__':
    app.run(debug=True)
