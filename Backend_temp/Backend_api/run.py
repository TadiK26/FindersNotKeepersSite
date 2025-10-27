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


#Create the app 
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'super-secret-key' 
app.config['SECRET_KEY'] = app.config['JWT_SECRET_KEY']  

#Time it takes for tokens to expire, access 
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=5)  
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)


db = SQLAlchemy(app)#to connect flask with the SQLite database
jwt = JWTManager(app)


token_blacklist = set()#blacklist tokens in memory 

#userModel model
class userModel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(10), nullable=False, default='user') 
    is_active = db.Column(db.Boolean, default=True)


#Create users table
with app.app_context():
    db.create_all()

'''These are role decorators'''

#Allows access only if the user role is admin
def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        current_user_id = int(get_jwt_identity())
        user = db.session.get(userModel, current_user_id)
        if not user or user.role != 'admin':
            return jsonify({"message": "ACcess denied, only admins allowed!"}), 403
        return fn(*args, **kwargs)
    return wrapper

#Allow access only if the logged-in user matches the userID in the route
def owner_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        current_user_id = int(get_jwt_identity())
        resource_user_id = kwargs.get('userID')
        if current_user_id != resource_user_id:
            return jsonify({"message": "Access denied, not the owner of the account"}), 403
        return fn(*args, **kwargs)
    return wrapper

#Check whether a token is blacklisted
@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    return jwt_payload["jti"] in token_blacklist

'''These are the steps used to access the web '''

#Step 1: userModel create an account(userModel registration)
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'user')

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    if userModel.query.filter_by(username=username).first():
        #return jsonify({"message": "Username already taken!"}), 400
        return jsonify({"message": "Username already exists!"}), 400

    if role not in ['user', 'admin']:
        return jsonify({"message": "Role must be 'user' or 'admin'."}), 400

    new_user = userModel(
        username=username,
        password=generate_password_hash(password),
        role=role
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': f"{username} you have been registered successfully as {role}."}), 201

#Step 2: usERS MUST BE able to log in
#Logging in generates access and refresh tokens for authorization
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = userModel.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"message": "Invalid username or password."}), 401

    if not user.is_active:
        return jsonify({"message": "userModel is not active"}), 403

    access_token = create_access_token(identity=str(user.id))#Token contaims user info(user.id, iat, exp, jti)
    refresh_token = create_refresh_token(identity=str(user.id))
    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token
    }), 200

#
@app.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user_id)
    return jsonify({"access_token": new_access_token}), 200


#This route check authentication,it is only accessible with a valid access token.
@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user_id = int(get_jwt_identity())
    user = db.session.get(userModel, current_user_id)
    return jsonify({"message": f"Hello, {user.username}, your role is: {user.role} and your information is protected."}), 200

#This route is for admins only, the can list all users or delte them using their user ID
@app.route('/admin/users', methods=['GET'])
@jwt_required()
@admin_required
def get_all_users():
    users = userModel.query.all()
    return jsonify([{"id": u.id, "username": u.username, "role": u.role} for u in users])

@app.route('/admin/users/<int:userID>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(userID):
    user = db.session.get(userModel, userID)
    if not user:
        return jsonify({"message": "userModel not found!"}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": f"This user, {user.username} has been deleted."}), 200

#Only the owner of the profile can access their own information
@app.route('/users/<int:userID>', methods=['GET'])
@jwt_required()
@owner_required
def get_user_profile(userID):
    user = db.session.get(userModel, userID)
    if not user:
        return jsonify({"message": "userModel not found!"}), 404
    return jsonify({"id": user.id, "username": user.username, "role": user.role})

#The user can log out during a session
@app.route('/logout', methods=['POST'])
@jwt_required()
def logout_access():
    jti = get_jwt()["jti"]
    token_blacklist.add(jti)
    return jsonify({"message": "Access token revoked, the user has logged out."}), 200

@app.route('/logout_refresh', methods=['POST'])
@jwt_required(refresh=True)
def logout_refresh():
    jti = get_jwt()["jti"]
    token_blacklist.add(jti)
    return jsonify({"message": "Refresh token revoked"}), 200


serializer = URLSafeTimedSerializer(app.config["SECRET_KEY"])
@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    username = data.get("username")
    user = userModel.query.filter_by(username=username).first()

    if not user:
        return jsonify({"message": "userModel not found"}), 404

    token = serializer.dumps(user.username, salt="password-reset")
    reset_link = f"http://localhost:5000/reset-password/{token}"
    return jsonify({"reset_link": reset_link}), 200

@app.route('/reset-password/<token>', methods=['POST'])
def reset_password(token):
    try:
        username = serializer.loads(token, salt="password-reset", max_age=3600)
    except Exception:
        return jsonify({"message": "Invalid or expired token"}), 400

    user = userModel.query.filter_by(username=username).first()
    if not user:
        return jsonify({"message": "userModel not found"}), 404

    data = request.get_json()
    new_password = data.get("new_password")
    if not new_password:
        return jsonify({"message": "New password is required"}), 400

    user.password = generate_password_hash(new_password)
    db.session.commit()
    return jsonify({"message": "Password has been reset successfully"}), 200

#Run the app
if __name__ == '__main__':
    app.run(debug=True)
