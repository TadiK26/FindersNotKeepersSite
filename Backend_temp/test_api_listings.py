import requests

BASE_URL = "http://127.0.0.1:5000/listings"

# Make sure there is a user with userID=1 in your database first!

# Example: create a listing
listing_data = {
    "title": "Lost Wallet",
    "description": "Black leather wallet lost near park",
    "user_id": 1
}

response = requests.post(BASE_URL + '/', json=listing_data)
print("POST /listings status:", response.status_code)
try:
    print("POST /listings response:", response.json())
except Exception as e:
    print("POST /listings response could not be decoded:", e, response.text)

# Get all listings
response = requests.get(BASE_URL + '/')
print("GET /listings status:", response.status_code)
try:
    print("GET /listings response:", response.json())
except Exception as e:
    print("GET /listings response could not be decoded:", e, response.text)

# Get a single listing by ID
listing_id = 1
response = requests.get(f"{BASE_URL}/{listing_id}")
print(f"GET /listings/{listing_id} status:", response.status_code)
try:
    print(f"GET /listings/{listing_id} response:", response.json())
except Exception as e:
    print(f"GET /listings/{listing_id} response could not be decoded:", e, response.text)
