from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from functools import wraps

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['JWT_SECRET_KEY'] = 'super-secret-key'

# Token lifetimes
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=1)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)

db = SQLAlchemy(app)
jwt = JWTManager(app)

# Store revoked tokens here (in-memory)
token_blacklist = set()

# User model with role
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(10), nullable=False, default='user')  # 'user' or 'admin'

with app.app_context():
    db.create_all()

# --- Decorators for role-based access ---
def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or user.role != 'admin':
            return jsonify({"message": "Admins only!"}), 403
        return fn(*args, **kwargs)
    return wrapper

def owner_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        resource_user_id = kwargs.get('user_id')
        if str(current_user_id) != str(resource_user_id):
            return jsonify({"message": "Access denied! Not the owner."}), 403
        return fn(*args, **kwargs)
    return wrapper

# --- Token blacklist check ---
@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    return jwt_payload["jti"] in token_blacklist

# --- Registration ---
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'user')  # default role is 'user'

    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists'}), 400

    if role not in ['user', 'admin']:
        return jsonify({'message': "Role must be 'user' or 'admin'"}), 400

    new_user = User(
        username=username,
        password=generate_password_hash(password),
        role=role
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': f"User '{username}' registered successfully as {role}"}), 201

# --- Login ---
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data.get('username')).first()
    if user and check_password_hash(user.password, data.get('password')):
        access_token = create_access_token(identity=str(user.id), expires_delta=timedelta(minutes=1))
        refresh_token = create_refresh_token(identity=str(user.id))
        return jsonify({
            "access_token": access_token,
            "refresh_token": refresh_token
        }), 200
    return jsonify({"message": "Invalid username or password"}), 401

# --- Refresh token ---
@app.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user_id, expires_delta=timedelta(minutes=1))
    return jsonify({"access_token": new_access_token}), 200

# --- Protected route (any authenticated user) ---
@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    return jsonify({"message": f"Hello, {user.username}! Role: {user.role}"}), 200

# --- Admin-only routes ---
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
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": f"User {user.username} deleted"}), 200

# --- Owner-only routes ---
@app.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
@owner_required
def get_user_profile(user_id):
    user = User.query.get(user_id)
    return jsonify({"id": user.id, "username": user.username, "role": user.role})

# --- Logout access token ---
@app.route('/logout', methods=['POST'])
@jwt_required()
def logout_access():
    jti = get_jwt()["jti"]
    token_blacklist.add(jti)
    return jsonify({"message": "Access token revoked"}), 200

# --- Logout refresh token ---
@app.route('/logout_refresh', methods=['POST'])
@jwt_required(refresh=True)
def logout_refresh():
    jti = get_jwt()["jti"]
    token_blacklist.add(jti)
    return jsonify({"message": "Refresh token revoked"}), 200

if __name__ == '__main__':
    app.run(debug=True)
