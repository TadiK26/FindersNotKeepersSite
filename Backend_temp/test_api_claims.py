import requests

BASE_URL = "http://127.0.0.1:5000"

# Create a claim
claim_data = {
    "listing_id": 1,
    "user_id": 1,
    "message": "I found this item!"
}
response = requests.post(f"{BASE_URL}/claims", json=claim_data)
print("POST /claims status:", response.status_code)
#print("POST /claims response:", response.json())
print("POST /claims response text:", response.text)


# Get claims for a user
user_id = 1
response = requests.get(f"{BASE_URL}/claims/{user_id}")
print(f"GET /claims/{user_id} status:", response.status_code)
print(f"GET /claims/{user_id} response:", response.json())
