import pytest
from werkzeug.security import generate_password_hash
import datetime
import jwt

from run import app, db, User


# ------------------- Helpers -------------------

def _encode_token(payload):
    token = jwt.encode(payload, app.config["SECRET_KEY"], algorithm="HS256")
    if isinstance(token, bytes):  # PyJWT < 2.0
        token = token.decode("utf-8")
    return token


@pytest.fixture(scope="function")
def client():
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"

    with app.app_context():
        db.create_all()

        # Create test users
        admin = User(username="admin_user",
                     password=generate_password_hash("password123"),
                     role="admin")
        user = User(username="normal_user",
                    password=generate_password_hash("password123"),
                    role="user")
        db.session.add_all([admin, user])
        db.session.commit()

        yield app.test_client()

        db.session.remove()
        db.drop_all()


def login(client, username, password="password123"):
    return client.post("/login", json={"username": username, "password": password})


def create_expired_token(username):
    with app.app_context():
        user = User.query.filter_by(username=username).first()
        payload = {
            "user_id": user.id,
            "exp": datetime.datetime.utcnow() - datetime.timedelta(hours=1)
        }
        return _encode_token(payload)


def create_token_for_deleted_user():
    payload = {
        "user_id": 9999,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }
    return _encode_token(payload)


# ------------------- Role & Ownership Tests -------------------

def test_admin_access(client):
    res = login(client, "admin_user")
    token = res.json["access_token"]
    r = client.get("/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200


def test_user_cannot_access_admin(client):
    res = login(client, "normal_user")
    token = res.json["access_token"]
    r = client.get("/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403


def test_owner_access(client):
    with app.app_context():
        user = User.query.filter_by(username="normal_user").first()
        user_id = user.id
    res = login(client, "normal_user")
    token = res.json["access_token"]
    r = client.get(f"/users/{user_id}", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200


def test_non_owner_access(client):
    with app.app_context():
        user = User.query.filter_by(username="normal_user").first()
    res = login(client, "admin_user")
    token = res.json["access_token"]
    r = client.get(f"/users/{user.id}", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403


# ------------------- Edge Cases -------------------

def test_access_without_token(client):
    r = client.get("/admin/users")
    assert r.status_code == 401


def test_access_with_invalid_token(client):
    headers = {"Authorization": "Bearer invalidtoken123"}
    r = client.get("/admin/users", headers=headers)
    assert r.status_code in [401, 422]


def test_access_with_expired_token(client):
    expired_token = create_expired_token("admin_user")
    headers = {"Authorization": f"Bearer {expired_token}"}
    r = client.get("/admin/users", headers=headers)
    assert r.status_code in [401, 422]  # Allow both

def test_inactive_user_access(client):
    with app.app_context():
        user = User.query.filter_by(username="normal_user").first()
        user.is_active = False
        db.session.commit()

    res = login(client, "normal_user")
    # Expect login to fail
    assert res.status_code in [401, 403]


def test_deleted_user_access(client):
    token = create_token_for_deleted_user()
    headers = {"Authorization": f"Bearer {token}"}
    r = client.get("/admin/users", headers=headers)
    assert r.status_code in [401, 403, 422]  # Allow JWT's 422


# ------------------- Auth Lifecycle Tests -------------------

def test_refresh_token_flow(client):
    res = login(client, "normal_user")
    refresh_token = res.json["refresh_token"]

    r = client.post("/refresh", headers={"Authorization": f"Bearer {refresh_token}"})
    assert r.status_code == 200
    assert "access_token" in r.json


def test_refresh_with_invalid_token(client):
    headers = {"Authorization": "Bearer invalidrefreshtoken"}
    r = client.post("/refresh", headers=headers)
    assert r.status_code in [401, 422]


def test_logout_revokes_token(client):
    res = login(client, "normal_user")
    token = res.json["access_token"]

    # Logout
    r = client.post("/logout", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200

    # Token should no longer work
    r = client.get("/protected", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401


def test_forgot_password_and_reset(client):
    r = client.post("/forgot-password", json={"username": "normal_user"})
    assert r.status_code == 200
    reset_link = r.json.get("reset_link")
    assert reset_link is not None

    reset_token = reset_link.split("/")[-1]

    new_pass = "newpass123"
    r = client.post(f"/reset-password/{reset_token}", json={"new_password": new_pass})
    assert r.status_code == 200

    # Login with new password
    r = client.post("/login", json={"username": "normal_user", "password": new_pass})
    assert r.status_code == 200
    assert "access_token" in r.json

    # Old password should fail
    r = client.post("/login", json={"username": "normal_user", "password": "password123"})
    assert r.status_code == 401


# ------------------- Registration Tests -------------------

def test_user_registration(client):
    r = client.post("/register", json={
        "username": "new_user",
        "password": "mypass123",
        "role": "user"
    })
    assert r.status_code == 201

    r = client.post("/login", json={"username": "new_user", "password": "mypass123"})
    assert r.status_code == 200
    assert "access_token" in r.json


def test_duplicate_registration(client):
    r = client.post("/register", json={
        "username": "normal_user",
        "password": "whatever",
        "role": "user"
    })
    assert r.status_code == 400
