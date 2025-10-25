import requests
import os

API_BASE = "http://127.0.0.1:5000"  # Change to your deployed API URL

class User:
    def __init__(self, UserID=None, Username=None, Role=None, access_token=None, refresh_token=None):
        self.UserID = UserID
        self.Username = Username
        self.Role = Role
        self.access_token = access_token
        self.refresh_token = refresh_token

    def get_headers(self):
        if not self.access_token:
            raise ValueError("User is not logged in or access token missing")
        return {"Authorization": f"Bearer {self.access_token}"}

    # ---------------- User Registration & Login ----------------
    # def register(self, username, email, password):
    #     payload = {"username": username, "email": email, "password": password}
    #     resp = requests.post(f"{API_BASE}/register", json=payload)
    #     if resp.status_code == 201:
    #         self.Username = username
    #     return resp.status_code, resp.json()


    def register(self, username, email, password):
        data = {"username": username, "email": email, "password": password}
        resp = requests.post(f"{self.API_BASE}/register", json=data)

        # Debug: print raw response
        print("Status code:", resp.status_code)
        print("Response text:", repr(resp.text))  # shows empty string if nothing returned

        try:
            return resp.status_code, resp.json()
        except requests.exceptions.JSONDecodeError:
            # Return the raw text if JSON decoding fails
            return resp.status_code, resp.text



    def login(self, username, password):
        payload = {"username": username, "password": password}
        resp = requests.post(f"{API_BASE}/login", json=payload)
        if resp.status_code == 200:
            data = resp.json()
            self.access_token = data.get("access_token")
            self.refresh_token = data.get("refresh_token")
        return resp.status_code, resp.json()

    def refresh_token_api(self):
        payload = {"refresh_token": self.refresh_token}
        resp = requests.post(f"{API_BASE}/refresh", json=payload)
        if resp.status_code == 200:
            self.access_token = resp.json().get("Access_token")
        return resp.status_code, resp.json()

    def logout(self):
        headers = self.get_headers()
        resp = requests.post(f"{API_BASE}/logout", headers=headers)
        if resp.status_code == 200:
            self.access_token = None
            self.refresh_token = None
        return resp.status_code, resp.json()

    # ---------------- Messaging ----------------
    def ContactUser(self, participant2ID):
        if self.UserID == participant2ID:
            return None
        headers = self.get_headers()
        resp = requests.get(f"{API_BASE}/messages/{self.UserID}/{participant2ID}", headers=headers)
        if resp.status_code == 404:
            # Create thread automatically
            self.SendMessage(recipient=participant2ID, contents="")
            resp = requests.get(f"{API_BASE}/messages/{self.UserID}/{participant2ID}", headers=headers)
        return f"thread_{min(self.UserID, participant2ID)}_{max(self.UserID, participant2ID)}", resp.json().get("messages", [])

    def SendMessage(self, recipient, contents, thread_id=None):
        headers = self.get_headers()
        payload = {"recipient": recipient, "contents": contents}
        if thread_id:
            payload["thread_id"] = thread_id
        resp = requests.post(f"{API_BASE}/messages", headers=headers, json=payload)
        if resp.status_code != 200:
            print("Error sending message:", resp.json())
        return resp.json()

    # ---------------- Listings ----------------
    def MakeListing(self, item_title, category_id, description, location, status, images):
        """
        images: list of image IDs [image1, image2, image3]
        """
        headers = self.get_headers()
        payload = {
            "ItemTitle": item_title,
            "CategoryID": category_id,
            "Description": description,
            "Location": location,
            "Status": status,
            "Images": images
        }
        resp = requests.post(f"{API_BASE}/listings", headers=headers, json=payload)
        return resp.status_code, resp.json()

    def UpdateListing(self, listing_id, item_title, category_id, description, location, status, images):
        headers = self.get_headers()
        payload = {
            "ListingID": listing_id,
            "ItemTitle": item_title,
            "CategoryID": category_id,
            "Description": description,
            "Location": location,
            "Status": status,
            "Images": images
        }
        resp = requests.put(f"{API_BASE}/listings", headers=headers, json=payload)
        return resp.status_code, resp.json()

    def RemoveListing(self, listing_id, reason):
        headers = self.get_headers()
        payload = {"ListingID": listing_id, "Reason": reason}
        resp = requests.delete(f"{API_BASE}/listings", headers=headers, json=payload)
        return resp.status_code, resp.json()

    # ---------------- Claims ----------------
    def Claim(self, listing_id, image_id, description):
        headers = self.get_headers()
        payload = {"ListingID": listing_id, "ImageID": image_id, "Description": description}
        resp = requests.post(f"{API_BASE}/claims", headers=headers, json=payload)
        return resp.status_code, resp.json()

    # ---------------- Password Reset ----------------
    def ForgotPassword(self, email):
        payload = {"email": email}
        resp = requests.post(f"{API_BASE}/forgot-password", json=payload)
        return resp.status_code, resp.json()

    def ResetPassword(self, token, new_password):
        payload = {"token": token, "new_password": new_password}
        resp = requests.post(f"{API_BASE}/reset-password", json=payload)
        return resp.status_code, resp.json()
