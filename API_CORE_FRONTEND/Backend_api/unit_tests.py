import pytest
from werkzeug.security import generate_password_hash
import datetime
import jwt
from extensions import db,revoke_token
from app import create_app
from models import userModel



def encodeToken(payload,app):
    token=jwt.encode(payload,app.config["SECRET_KEY"],algorithm="HS256")##Create jwt token manually
    if isinstance(token,bytes):token=token.decode("utf-8")
    return token


#Setup test client and temporary database
@pytest.fixture(scope="function")
def testClient():
    app=create_app()
    app.config["TESTING"]=True
    app.config["SQLALCHEMY_DATABASE_URI"]="sqlite:///:memory:"
    app.config["JWT_SECRET_KEY"]="test_jwt_secret"
    app.config["SECRET_KEY"]="test_secret"
    with app.app_context():
        db.create_all()
        #Add admin and normal user for testing
        admin=userModel(username="admin_user",password=generate_password_hash("password123"),role="admin")
        user=userModel(username="normal_user",password=generate_password_hash("password123"),role="user")
        db.session.add_all([admin,user])
        db.session.commit()
        yield app.test_client(),app
        db.session.remove()
        db.drop_all()

#Helper to login and get tokens
def loginUser(client,username,password="password123"):
    return client.post("/auth/login",json={"username":username,"password":password})

def createExpiredToken(app,username):
    #Generate a jwt tokenn that has already expired
    with app.app_context():
        user=userModel.query.filter_by(username=username).first()
        payload={"userID":user.userID,"exp":datetime.datetime.utcnow()-datetime.timedelta(hours=1)}
        return encodeToken(payload,app)

def createDeletedUserToken(app):
    #Generate a token for a deleted or anon-existent user
    payload={"userID":9999,"exp":datetime.datetime.utcnow()+datetime.timedelta(hours=1)}
    return encodeToken(payload,app)

#Testing roles and profile owner ship
def testAdminCanAccessAdminRoutes(testClient):
    c,app=testClient
    #Admins should be able to access all admin endpoints
    res=loginUser(c,"admin_user")
    token=res.json["access_token"]
    r=c.get("/admin/admin/users",headers={"Authorization":f"Bearer {token}"})
    assert r.status_code==200

def testNormalUserCannotAccessAdminRoutes(testClient):
    c,app=testClient
    #Normal users cannot access admin endpoints
    res=loginUser(c,"normal_user")
    token=res.json["access_token"]
    r=c.get("/admin/admin/users",headers={"Authorization":f"Bearer {token}"})
    assert r.status_code==403

def testUserCanAccessOwnProfile(testClient):
    c,app=testClient
    #Users can view their own profile
    with app.app_context():
        user=userModel.query.filter_by(username="normal_user").first()
        userID=user.userID
    res=loginUser(c,"normal_user")
    token=res.json["access_token"]
    r=c.get(f"/users/{userID}",headers={"Authorization":f"Bearer {token}"})
    assert r.status_code==200

def testUsersCannotAccessOthersProfile(testClient):
    c,app=testClient
    #Users cannot view someone else's profile
    with app.app_context():
        user=userModel.query.filter_by(username="normal_user").first()
    res=loginUser(c,"admin_user")
    token=res.json["access_token"]
    r=c.get(f"/users/{user.userID}",headers={"Authorization":f"Bearer {token}"})
    assert r.status_code==403

#Testing edge cases
def testAccessFailsWithoutToken(testClient):
    c,_=testClient
    #Requests with no token are rejected
    r=c.get("/admin/admin/users")
    assert r.status_code==401

def testAccessFailsWithInvalidToken(testClient):
    c,_=testClient
    #Invalid tokens are rejected
    headers={"Authorization":"Bearer invalidtoken123"}
    r=c.get("/admin/admin/users",headers=headers)
    assert r.status_code in [401,422]

def testAccessFailsWithExpiredToken(testClient):
    c,app=testClient
    #Expired tokens are rejected
    expired_token=createExpiredToken(app,"admin_user")
    headers={"Authorization":f"Bearer {expired_token}"}
    r=c.get("/admin/admin/users",headers=headers)
    assert r.status_code in [401,422]

def testInactiveUsersCannotLogin(testClient):
    c,app=testClient
    #Users marked inactive cannot login
    with app.app_context():
        user=userModel.query.filter_by(username="normal_user").first()
        user.is_active=False
        db.session.commit()
    res=loginUser(c,"normal_user")
    assert res.status_code in [401,403]

def testDeletedUserTokenIsInvalid(testClient):
    c,app=testClient
    #Tokens for deleted users should fail
    token=createDeletedUserToken(app)
    headers={"Authorization":f"Bearer {token}"}
    r=c.get("/admin/admin/users",headers=headers)
    assert r.status_code in [401,403,422]

#Authentication cycles
def testRefreshTokenReturnsNewAccessToken(testClient):
    c,_=testClient
    res=loginUser(c,"normal_user")
    refresh_token=res.json["refresh_token"]
    r=c.post("/auth/refresh",headers={"Authorization":f"Bearer {refresh_token}"})
    assert r.status_code==200
    #Use the correct key returned by api
    assert "Access_token" in r.json


def testRefreshFailsWithInvalidToken(testClient):
    c,_=testClient
    #Invalid refresh token fails
    headers={"Authorization":"Bearer invalidrefreshtoken"}
    r=c.post("/auth/refresh",headers=headers)
    assert r.status_code in [401,422]

def testLogoutRevokesTokenAndBlocksAccess(testClient):
    c,_=testClient
    #After logout the token should no longer work
    res=loginUser(c,"normal_user")
    token=res.json["access_token"]
    r=c.post("/auth/logout",headers={"Authorization":f"Bearer {token}"})
    assert r.status_code==200
    r=c.get("/auth/protected",headers={"Authorization":f"Bearer {token}"})
    assert r.status_code==401

def testPasswordResetFlowWorks(testClient):
    c,_=testClient
    #Forgot password generates link and allows reset
    r=c.post("/auth/forgot-password",json={"username":"normal_user"})
    assert r.status_code==200
    reset_link=r.json.get("reset_link")
    reset_token=reset_link.split("/")[-1]
    new_pass="newpass123"
    r=c.post(f"/auth/reset-password/{reset_token}",json={"new_password":new_pass})
    assert r.status_code==200
    #Login with new password works
    r=c.post("/auth/login",json={"username":"normal_user","password":new_pass})
    assert r.status_code==200
    assert "access_token" in r.json
    #Old password no longer works
    r=c.post("/auth/login",json={"username":"normal_user","password":"password123"})
    assert r.status_code==401

#Tetsing user registration
def testCanRegisterAndLoginNewUser(testClient):
    c,_=testClient
    #Register a new user
    r=c.post("/auth/register",json={"username":"new_user","password":"mypass123","role":"user"})
    assert r.status_code==201
    #Login should succeed after registering
    r=c.post("/auth/login",json={"username":"new_user","password":"mypass123"})
    assert r.status_code==200
    assert "access_token" in r.json

def testCannotRegisterDuplicateUser(testClient):
    c,_=testClient
    #Trying to register existing user fails
    r=c.post("/auth/register",json={"username":"normal_user","password":"whatever","role":"user"})
    assert r.status_code in [400,409]
