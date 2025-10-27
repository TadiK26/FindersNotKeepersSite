import requests

BASE_URL = "http://127.0.0.1:5000/auth"  # Adjust if your API base is different

# Use a test user that is unlikely to already exist
TEST_USER = {
    "username": "TestUser1234",
    "email": "testuser1234@example.com",
    "password": "Test@12345"
}

def register_user():
    url = f"{BASE_URL}/register"
    resp = requests.post(url, json={
        "username": TEST_USER["username"],
        "email": TEST_USER["email"],
        "password": TEST_USER["password"]
    })

    if resp.status_code == 201:
        print("User registered successfully!")
    elif resp.status_code == 409:
        print("User already exists, skipping registration.")
    else:
        print("Registration failed:", resp.status_code, resp.text)
    
def login_user():
    url = f"{BASE_URL}/login"
    resp = requests.post(url, json={
        "username": TEST_USER["username"],
        "password": TEST_USER["password"]
    })

    if resp.status_code == 200:
        token = resp.json().get("access_token")
        print("Login successful!")
        return token
    else:
        print("Login failed:", resp.status_code, resp.json())
        return None

def test_protected_route(token):
    if not token:
        print("Skipping protected route test: no access token.")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/protected", headers=headers)
    
    print("Protected route status:", resp.status_code)
    print("Protected route response:", resp.json())

if __name__ == "__main__":
    register_user()
    access_token = login_user()
    test_protected_route(access_token)
