import requests

BASE_URL = "http://127.0.0.1:5000"  # your Flask server

# Example message payload
payload = {
    "sender_id": 1,
    "receiver_id": 2,
    "content": "Hello, this is a test message!",
    # Only include thread_id if you already know it; otherwise omit it to create/find a thread
    # "thread_id": "thread1"
}

try:
    response = requests.post(f"{BASE_URL}/messages", json=payload)
    print("POST /messages status:", response.status_code)

    try:
        json_data = response.json()
        print("POST /messages JSON response:", json_data)

        # Access the thread ID safely
        thread_id = json_data.get("threadID") or json_data.get("thread_id")
        print("Thread ID:", thread_id)

    except requests.exceptions.JSONDecodeError:
        print("Response is not valid JSON. Raw response:")
        print(response.text)

except requests.exceptions.RequestException as e:
    print("Request failed:", e)
