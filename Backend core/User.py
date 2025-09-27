import mysql.connector
import os
import sys
import json
import base64
import hashlib
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from dotenv import load_dotenv
from datetime import date
from Notification import Notification

#Represents a user in the system
class User:
    def __init__(self, UserID=None, Username=None, Lastname=None, Firstnames=None,
                 Email=None, PasswordHash=None, Role=None,
                 NotificationPreference=0, DateOfCreation=None,
                 CreationMethod=None, LastLoginDate=None, ProfileImageID=None):
        
        self.UserID = UserID
        self.Username = Username
        self.Lastname = Lastname
        self.Firstnames = Firstnames
        self.Email = Email
        self.PasswordHash = PasswordHash
        self.Role = Role
        self.NotificationPreference = NotificationPreference
        self.DateOfCreation = DateOfCreation
        self.CreationMethod = CreationMethod
        self.LastLoginDate = LastLoginDate
        self.ProfileImageID = ProfileImageID

    #Connect to the database
    @staticmethod
    def get_connection():
        load_dotenv()

        return mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database="findersnotkeepers"
        )
    
    def UpdateProfile(self):
        """
            Update user profile details
            Args: 
                self: class object
            Return:
                returns true if update is successful else false
        """
        conn = self.get_connection()
        cursor = conn.cursor()

        query = """
            UPDATE Users SET
                Username=%s, Lastname=%s, Firstnames=%s, Email=%s, UP_ID=%s,
                PasswordHash=%s, Role=%s, NotificationPreference=%s, DateOfCreation=%s,
                CreationMethod=%s, PhoneNumber=%s, LastLoginDate=%s, ProfileImageID=%s
            WHERE UserID=%s
            """
        values = (self.Username, self.Lastname, self.Firstnames, self.Email,
                      self.UP_ID, self.PasswordHash, self.Role, self.NotificationPreference,
                      self.DateOfCreation, self.CreationMethod, self.PhoneNumber,
                      self.LastLoginDate, self.ProfileImageID, self.UserID)
        try:
            cursor.execute(query, values)
        except:
            return False

        conn.commit()
        cursor.close()
        conn.close()



        return True
    
    def MakeListing(self, ItemTitle:str, CategoryID:int, Description: str, Location: str, Contact: bool, Image1: int, Image2 = None, Image3 = None):
        """
            Create a new item listing
            Args:
                self(User): Class object
            Returns:
                int - Returns 1 for a successfull post and 2 for an error
        """
        
        conn = self.get_connection()
        cursor = conn.cursor()

        query = """
            INSERT INTO Listings 
            (UserID, ItemTitle, CategoryID, Description, Image1ID, LocationLost, Status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
        values = (self.UserID, ItemTitle, CategoryID, Description, Image1, Location, "Waiting for Verification")
        
        cursor.execute(query, values)
        conn.commit()
        listingID = cursor.lastrowid

        if Image2 is not None:
            query = """
            UPDATE Listings SET
                Image2ID=%s
            WHERE ListingID=%s
            """

            values = (Image2, listingID)
            cursor.execute(query, values)
            conn.commit()

        if Image3 is not None:
            query = """
            UPDATE Listings SET
                Image3ID=%s
            WHERE ListingID=%s
            """

            values = (Image3, listingID)
            cursor.execute(query, values)
            conn.commit()
        
        #Add check for a null phone number if number is missing return a listing failed
        if Contact:
            
            query = """
            UPDATE Listings SET
                ContactInfo=%s
            WHERE ListingID=%s
            """

            values = (self.PhoneNumber, listingID)
            cursor.execute(query, values)
            conn.commit()

        #Send notification when admin approves listing
        #Noti = Notification(3,listingID)

        cursor.close()
        conn.close()

        return 1
        
    def RemoveListing(self, listingID: int, reason: str):
        """
        Remove an existing listing.
        Args:
            self: User object
            listingID(int): ID of the listing
            reason(str): Reason for removal of listing
        Returns:
            int: indicates success of listing removal
        """
        
        conn = self.get_connection()
        cursor = conn.cursor()

        query = """
            UPDATE Listings SET
                Status="Deleted by User"
            WHERE UserID=%s
            """

        values = (listingID)
        cursor.execute(query, values)

        conn.commit()
        cursor.close()
        conn.close()


        return 1
    
    def UpdateListing(self, listingID: int, ItemTitle:str, CategoryID:int, Description: str, Location: str, Contact: bool, Image1: int, Image2 = None, Image3 = None):
        """
            Update an existing listing.
            Args:
                self(User): Class object
            Returns:
                int - Returns 1 for a successfull post and 2 for an error
        """

        conn = self.get_connection()
        cursor = conn.cursor()

        query = """
            UPDATE Listings SET
            UserID = %s, ItemTitle= %s, CategoryID= %s, Description= %s, Image1ID= %s, LocationLost= %s, Status= %s
            WHERE ListingID = %s
            """
        values = (self.UserID, ItemTitle, CategoryID, Description, Image1, Location, "Waiting for Verification",listingID)
        cursor.execute(query, values)
        conn.commit()



        if Image2 is not None:
            query = """
            UPDATE Listings SET
                Image2ID=%s
            WHERE ListingID=%s
            """

            values = (Image2, listingID)
            cursor.execute(query, values)
            conn.commit()

        if Image3 is not None:
            query = """
            UPDATE Listings SET
                Image3ID=%s
            WHERE ListingID=%s
            """

            values = (Image3, listingID)
            cursor.execute(query, values)
            conn.commit()
        
        #Add check for a null phone number if number is missing return a listing failed
        if Contact:
            
            query = """
            UPDATE Listings SET
                ContactInfo=%s
            WHERE ListingID=%s
            """

            values = (self.PhoneNumber, listingID)
            cursor.execute(query, values)
            conn.commit()

        #Send notification when admin approves listing
        #Noti = Notification(3,listingID)

        cursor.close()
        conn.close()

        pass
    
    def MarkReturned(self, listingID: int):

        """Claimaint/Poster can mark an item as being returned to its owner.
            Args:
                self: User object
                listingID(int): ID of the listing
            Returns:
                int: indicates success of listing removal       
        """

        conn = self.get_connection()
        cursor = conn.cursor()

        query = """
            UPDATE Listings SET
                Status="Completed"
            WHERE UserID=%s
            """

        values = (listingID)
        cursor.execute(query, values)

        conn.commit()
        cursor.close()
        conn.close()

        return 1
    
    def Claim(self, listingID: int, ImageID: int):
        """
            Claim an item the user believes is theirs and upload the required proof.
            Args:
                self(User): Class object
                listingID(int): Id of the listing the user is claiming
                ImageID: ImageID for the image used as verification
        """ 

        #Sends a notification to the administrator to verify the proof
        Noti = Notification(5,listingID, ImageID, self.UserID)

    def ContactUser(self, participant2ID):
        """ Opens the message history between two users
            Args:
                self: Class Object
                participant2ID(int): Id of the other user who the current user wishes to contact
            Returns:
                Contents of text thread as well as the threadID
        """

        #Normalizes the interaction between the two users to prevent duplication
        # 3 contacting 7 is same interaction as 7 contacting 3
        if self.UserID != participant2ID:
            user_1 = min(self.UserID,participant2ID)
            user_2 = max(self.UserID,participant2ID)

            conn = self.get_connection()
            cursor = conn.cursor()

            cantor_pair = int((user_1**2 + user_1 + 2*user_1*user_2 + 3*user_2 + user_2**2)/2)

            letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            letter_pair = ""
            n = cantor_pair

            for i in range(4):
                letter_pair = letters[n % 26] + letter_pair
                n //= 26

            messageID = f"{letter_pair}_{cantor_pair}"
            print(messageID)

            query = """ SELECT * FROM MessageThread
                        WHERE ThreadID = %s"""
            
            values = (messageID)

            cursor.execute(query, values)

            row = cursor.fetchone()

            cursor.close()
            conn.close()


            if(row is None):
                self.CreateMessageThread(user_1, user_2)


            subfolder = "MessageThreads"
            filename = str(messageID) + "_messages.txt"
            filepath = os.path.join(subfolder, filename)

            content = None

            with open(filepath, "r") as file:
                content = self.decrypt(user_1, user_2, f"{messageID}.txt")
            
            return content

        else:
            return None
      
    def CreateMessageThread(self,threadId, party1: int, party2: int):
        """Create a message thread between 2 users
            Args:
                threadId(string):   the unique pairing found from the cantor pair of the two users
                party1(int): user id with lowest absolute value 
                party2(int): user id with highest absolute value
            Returns:
                int: the id of the newly created message thread
        """

        conn = self.get_connection()
        cursor = conn.cursor()

        #Create an entry of the message thread
        query = """ INSERT INTO MessageThread 
                    (ThreadID, Participant1, Participant2)
                    VALUES(%s, %s,%s)
                """
            
        values = (threadId, party1, party2)
        cursor.execute(query, values) 
        conn.commit()

        cursor.close()
        conn.close()

        #Create the file with the unique primary key as title
        subfolder = "MessageThreads"
        filename = str(threadId) + ".json"
        filepath = os.path.join(subfolder, filename)

        os.makedirs(subfolder, exist_ok=True)

        # Write to the file inside the subfolder
        with open(filepath, "w") as file:
            file.write(f"Message thread between {party1} and {party2}.\n")
    
    def SendMessage(self, messageID: int, recipient: int, contents: str):
        """Send a message to another user.
            Args: 
                messageID(int):     Unique ID for the interaction between the two users
        """
        
        conn = self.get_connection()
        cursor = conn.cursor()

    def generateKey(self, id1: int, id2: int):

        # Sort so that either user can supply ids in any order
        a, b = sorted([int(id1), int(id2)])
        shared = f"{a}:{b}".encode('utf-8')
        # Deterministic "salt" derived from the ids (so both sides get same salt)
        salt = hashlib.sha256(shared).digest()[:16]  # 16 bytes
        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=32,           # 32 bytes = 256-bit key
            salt=salt,
            info=b"two-id-comm-key",
        )
        key = hkdf.derive(shared)
        return key

    def decrypt(self, id1: int, id2: int, filename: str) -> str:
        """
            Decrypt a file and return its contents as a plain text string.
            
            Args:
                id1, id2: User IDs for key generation
                filename: Path to the encrypted file
                
            Returns:
                str: Decrypted contents as a plain text string
        """
        with open(f"{filename}.json", 'r') as f:
            data = json.load(f)
        nonce = base64.b64decode(data["nonce_b64"])
        ct = base64.b64decode(data["ciphertext_b64"])
        key = self.generateKey(id1, id2)
        aesgcm = AESGCM(key)
        try:
            plaintext_bytes = aesgcm.decrypt(nonce, ct, associated_data=None)
            return plaintext_bytes.decode('utf-8')
        except Exception as e:
            print("Decryption failed (wrong ids or tampered file).")
            raise

    def encrypt(self, id1: int, id2: int, plaintext: str, filename: str):
        """
            Append plaintext to the existing decrypted contents of a file and encrypt back to the same file.
            
            Args:
                id1, id2: User IDs for key generation
                plaintext: Text to append to the file
                filename: Path to the encrypted file to modify
        """

        # Try to decrypt existing file contents if file doesn't exist or can't be decrypted return nothing
        try:
            existing_content = self.decrypt(id1, id2, filename)
        except (FileNotFoundError, json.JSONDecodeError, Exception):
            
            return 0
        
        # Append new text to the existing content
        combined_content = existing_content + plaintext
        
        # Encrypt the combined content
        key = self.generateKey(id1, id2)
        aesgcm = AESGCM(key)
        nonce = os.urandom(12)  # 96-bit nonce for AES-GCM
        ct = aesgcm.encrypt(nonce, combined_content.encode('utf-8'), associated_data=None)
        
        # Package data needed for decryption
        out = {
            "ids_sorted": ":".join(map(str, sorted([int(id1), int(id2)]))),
            "salt_hex": hashlib.sha256(f"{min(int(id1),int(id2))}:{max(int(id1),int(id2))}".encode()).digest()[:16].hex(),
            "nonce_b64": base64.b64encode(nonce).decode('utf-8'),
            "ciphertext_b64": base64.b64encode(ct).decode('utf-8'),
            "kdf_info": "HKDF-SHA256 length=32 info='two-id-comm-key' deterministic-salt-from-ids"
        }
        
        # Write encrypted content back to the same file
        with open(f"{filename}.txt", 'w') as f:
            json.dump(out, f, indent=2)
        
        return 1
    

