from flask import Blueprint,request,jsonify,current_app
from werkzeug.security import generate_password_hash,check_password_hash
from extensions import db,jwt
from models import User
from sqlalchemy.exc import IntegrityError
from flask_jwt_extended import (get_jwt,verify_jwt_in_request, create_refresh_token,
                                jwt_required, get_jwt_identity, create_access_token)
from itsdangerous import URLSafeTimedSerializer


auth_bp=Blueprint('auth',__name__,url_prefix='/auth')#Blueprint for athenitcation
#finder_bp = Blueprint('finders', __name__, url_prefix='/findersnotkeepers')#home blueprint

revoke_token=set()#blacklist tokens in memoryh

#Route for landing page
# @finder_bp.route('/')
# def home():
#     return 'Track your lost item with us'

def check_if_token_revoked(jwt_header,jwt_payload):
    jti=jwt_payload.get("jti")
    return jti in revoke_token

def get_serializer():
    # create serializer on demand with app secret
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"])


#Step 1:User creates an account(User registration)
@auth_bp.route('/register',methods=['POST'])
def register():
    user_data=request.get_json() or {}
    username=user_data.get('username')
    password=user_data.get('password')
    role=user_data.get('role','user')

    #Chcek if username and password are provided by usr
    if not username or not password:
        return jsonify({"Error":"Username and password are required to register."}),400
    
    #Check if usernames meets the max 14 character requirements
    if (len(username)>14):
        return jsonify({"Error":"Username must be 14 characters or less"}), 400

    #Checj if the username exists
    # if User.query.filter_by(username=username).first():
    #     #return jsonify({"message": "Username already taken!"}), 400
    #     return jsonify({"Error":"Username already exists!"}), 400

    #Validate users
    if role not in ['user','admin']:
        return jsonify({"Error":"Role must be 'user' or 'admin'."}),400
    
    #Create user and hash their password
    hashed_password=generate_password_hash(password)
    new_user=User(username=username,password=hashed_password,role=role)
    db.session.add(new_user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error":"username or email already exists"}),409
    db.session.commit()

    return jsonify({'message':f"Hello,{username} you have been registered successfully as {role}."}),201


# #Step 2: usERS MUST BE able to log in
@auth_bp.route('/login',methods=['POST'])
def login():
    #USer must enter their login details
    user_data=request.get_json() or {}
    username=user_data.get('username')
    password=user_data.get('password')

    user=User.query.filter_by(username=username).first()

    if not username or not password:
        return jsonify({"message":"username and password required"}),400

    #Check if details entered are correct
    #hashedPassword_check=check_password_hash(user.password,password)
    if not user or not check_password_hash(user.password,password):
        return jsonify({"message":"Invalid username or password!"}),401

    #Check if the user is active
    if not user.is_active:
        return jsonify({"message":"User is not active!"}),403
    
    #Generate  hashed access token and refresh token
    # access_token = create_access_token(identity=str(user.user_id), additional_claims={"role": user.role})
    # refresh_token = create_refresh_token(identity=str(user.user_id))

    access_token=create_access_token(identity=str(user.user_id),additional_claims={"role":user.role})
    refresh_token=create_refresh_token(identity=str(user.user_id))
    return jsonify({"access_token": access_token,"refresh_token":refresh_token}),200

# Refresh token route to generate new access token
@auth_bp.route('/refresh',methods=['POST'])
@jwt_required(refresh=True)  # only accept refresh tokens
def refresh():
    currentUser_id =int(get_jwt_identity())
    newAccess_token = create_access_token(identity=str(currentUser_id))
    return jsonify({"Access_token":newAccess_token}),200

#This route check authentication,it is only accessible with a valid access token.
@auth_bp.route('/protected',methods=['GET'])
@jwt_required()
def protected():
    currentUser_id=int(get_jwt_identity())
    user=db.session.get(User,currentUser_id)
    if not user:
        return jsonify({"message": "user not found"}),404
    return jsonify({"message": f"Hello, {user.username},your role is:{user.role} and your information is protected."}),200

#The user can log out during a session
@auth_bp.route('/logout',methods=['POST'])
@jwt_required()
def logout_access():
    jti=get_jwt()["jti"]
    revoke_token.add(jti)
    return jsonify({"message":"Access token revoked, the user has logged out successfully."}),200

#Check if token still works after logging out
@auth_bp.route('/logout_refresh',methods=['POST'])
@jwt_required(refresh=True)
def logout_refresh():
    jti=get_jwt()["jti"]
    revoke_token.add(jti)
    return jsonify({"message":"Refresh token has been revoked."}),200

#create serializer inside function using app secret
#User route to request password
#serializer = URLSafeTimedSerializer(auth_bp.config["SECRET_KEY"])
@auth_bp.route('/forgot-password',methods=['POST'])
def forgot_password():
    user_data=request.get_json() or {}
    username=user_data.get("username")

    if not username:
        return jsonify({"error":"username required"}),400

    user=User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"Error":"User not found!"}),404

    serializer=get_serializer()
    user_token=serializer.dumps(user.username,salt="password-reset")
    reset_link=f"http://localhost:5000/reset-password/{user_token}" #should via email
    return jsonify({"reset_link":reset_link}),200

@auth_bp.route('/reset-password/<token>',methods=['POST'])
def reset_password(token):
    serializer=get_serializer()

    try:
        username=serializer.loads(token,salt="password-reset",max_age=3600)
    except Exception:
        return jsonify({"message":"Invalid or expired token"}), 400

    user=User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"message":"User not found"}), 404

    data=request.get_json() or {}
    new_password=data.get("new_password")
    if not new_password:
        return jsonify({"message":"New password is required"}), 400

    user.password=generate_password_hash(new_password)
    db.session.commit()
    return jsonify({"message":"Password has been reset successfully"}), 200
