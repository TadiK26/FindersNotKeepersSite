import requests

BASE_URL = "http://127.0.0.1:5000"

# Fixed username
username = "testuser"
original_password = "password123"
new_password = "newSecret123"

#Start with the original password
current_password = original_password

#Storage for tokens
access_token = None
refresh_token = None

def print_step(step, response):
    #print(f"\n\t\t\t{step}\t")
    print(f"\n---------------------{step}----------------------")
    try:
        print("Status:", response.status_code)
        print("Response:", response.json())
    except Exception:
        print("Raw Response:", response.text)

# 1 Register (ignore user, if already exists)
resp = requests.post(f"{BASE_URL}/register", json={
    "username": username,
    "password": original_password,
    "role": "user"
})
if resp.status_code == 400 and "already exists" in resp.text:
    print(f"\n userModel {username} already exists, please login.")
else:
    print_step("Register", resp)

# 2 Login (try current password, fallback to new password if needed)
resp = requests.post(f"{BASE_URL}/login", json={
    "username": username,
    "password": current_password
})
if resp.status_code != 200:
    print("\n Password was changed, please log in using new password.")
    current_password = new_password
    resp = requests.post(f"{BASE_URL}/login", json={
        "username": username,
        "password": current_password
    })
print_step("Login", resp)
tokens = resp.json()
access_token = tokens.get("access_token")
refresh_token = tokens.get("refresh_token")

# 3 Protected route
resp = requests.get(f"{BASE_URL}/protected",
                    headers={"Authorization": f"Bearer {access_token}"})
print_step("Protected", resp)

# 4 Admin route (should fail for normal users)
resp = requests.get(f"{BASE_URL}/admin/users",
                    headers={"Authorization": f"Bearer {access_token}"})
print_step("Admin Route", resp)

# 5 Owner route (assume ID=1)
resp = requests.get(f"{BASE_URL}/users/1",
                    headers={"Authorization": f"Bearer {access_token}"})
print_step("Owner Route", resp)

# 6 Refresh token
resp = requests.post(f"{BASE_URL}/refresh",
                     headers={"Authorization": f"Bearer {refresh_token}"})
print_step("Refresh Token", resp)
new_access_token = resp.json().get("access_token")

# 7 Logout
resp = requests.post(f"{BASE_URL}/logout",
                     headers={"Authorization": f"Bearer {new_access_token}"})
print_step("Logout", resp)

# 8 Protected after logout (should fail)
resp = requests.get(f"{BASE_URL}/protected",
                    headers={"Authorization": f"Bearer {new_access_token}"})
print_step("Protected After Logout", resp)

# 9 Forgot password
resp = requests.post(f"{BASE_URL}/forgot-password", json={
    "username": username
})
print_step("Forgot Password", resp)
reset_data = resp.json()
reset_link = reset_data.get("reset_link")
reset_token = reset_link.split("/")[-1] if reset_link else None

# 10 Reset password
if reset_token:
    resp = requests.post(f"{BASE_URL}/reset-password/{reset_token}", json={
        "new_password": new_password
    })
    print_step("Reset Password", resp)

    # Update current_password for next steps
    current_password = new_password

    #  Login with new password
    resp = requests.post(f"{BASE_URL}/login", json={
        "username": username,
        "password": current_password
    })
    print_step("Login With New Password", resp)
else:
    print("\n No reset token received. Forgot-password may have failed.")
