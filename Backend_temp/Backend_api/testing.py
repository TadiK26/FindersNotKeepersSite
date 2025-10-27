import requests

BASE_URL="http://127.0.0.1:5000"

#Testuser credentials
username="Getty"
original_password="Getty1976"
new_password="Gettty"

#Tokens
access_token=None
refresh_token=None

def print_step(step,response):
    print(f"\n--- {step} ---")
    print("Status:",response.status_code)
    try:
        print("Response:",response.json())
    except Exception:
        print("Raw Response:",response.text)

#1.Register(ignore if already exists)
resp = requests.post(f"{BASE_URL}/auth/register", json={
    "username": username,
    "password": original_password,
    "role": "user"
})
if resp.status_code in [400, 409]:
    print(f"userModel '{username}' already exist.")
else:
    print_step("Register",resp)

#2. Login
resp=requests.post(f"{BASE_URL}/auth/login",json={
    "username":username,
    "password":original_password
})
if resp.status_code!=200:
    print("Login failed,use your new password")
    resp=requests.post(f"{BASE_URL}/auth/login",json={
        "username":username,
        "password":new_password
    })

print_step("Login",resp)
tokens=resp.json()
access_token=tokens.get("access_token")
refresh_token=tokens.get("refresh_token")

#3.Access protected route
resp=requests.get(f"{BASE_URL}/auth/protected",headers={"Authorization": f"Bearer {access_token}"})
print_step("Protected",resp)

#4.Access owner route
resp = requests.get(f"{BASE_URL}/users/1",headers={"Authorization": f"Bearer {access_token}"})
print_step("Owner Route", resp)

#5.Access admin route (should fail)
resp = requests.get(f"{BASE_URL}/admin/admin/users",headers={"Authorization": f"Bearer {access_token}"})
print_step("Admin Route", resp)

#6.Refresh token
resp = requests.post(f"{BASE_URL}/auth/refresh",headers={"Authorization": f"Bearer {refresh_token}"})
print_step("Refresh Token", resp)
if resp.status_code == 200:
    access_token = resp.json().get("Access_token")

#7.Logout
resp = requests.post(f"{BASE_URL}/auth/logout",headers={"Authorization": f"Bearer {access_token}"})
print_step("Logout", resp)

#8.Access protected route after logout (should fail)
resp = requests.get(f"{BASE_URL}/auth/protected",headers={"Authorization": f"Bearer {access_token}"})
print_step("Protected After Logout", resp)

#9.Forgot password
resp = requests.post(f"{BASE_URL}/auth/forgot-password", json={
    "username": username
})
print_step("Forgot password", resp)
reset_link = resp.json().get("reset_link")
reset_token = reset_link.split("/")[-1] if reset_link else None

#10.Reset password
if reset_token:
    resp = requests.post(f"{BASE_URL}/auth/reset-password/{reset_token}", json={
        "new_password": new_password
    })
    print_step("Reset your password", resp)

    #11. Login with new password
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "username": username,
        "password": new_password
    })
    print_step("Login with new password", resp)
