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
                 CreationMethod=None, LastLoginDate=None, ProfileImageID=None, sessionIP = None, sessionID = None):
        
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
        self.sessionIP = sessionIP
        self.sessionID = sessionID

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

        print(self.UserID)

        query = """
            UPDATE Users SET
                Username=%s, Lastname=%s, Firstnames=%s, Email=%s,
                PasswordHash=%s, Role=%s, NotificationPreference=%s, DateOfCreation=%s,
                CreationMethod=%s, LastLoginDate=%s, ProfileImageID=%s
            WHERE UserID=%s
            """
        values = (self.Username, self.Lastname, self.Firstnames, self.Email,
                    self.PasswordHash, self.Role, self.NotificationPreference,
                      self.DateOfCreation, self.CreationMethod, 
                      self.LastLoginDate, self.ProfileImageID, self.UserID)
        try:
            cursor.execute(query, values)
        except Exception as e:
            print(e)
            return False

        conn.commit()

        audit_query = """
                INSERT INTO AuditLog (UserID, ActionID, IPAddress, UserAgent, SessionID)
                VALUES (%s, %s, %s, %s, %s)
            """

        values = (self.UserID, 8, self.sessionIP, "Unknown", self.sessionID)

        cursor.execute(audit_query, values)
        conn.commit()

        cursor.close()
        conn.close()



        return True
    
    def MakeListing(self, ItemTitle:str, CategoryID:int, Description: str, Location: str, Status: str, Image1: int, Image2 = None, Image3 = None):
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
        values = (self.UserID, ItemTitle, CategoryID, Description, Image1, Location, f"Waiting for Verification-{Status}")
        
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
        
        #Send notification when admin approves listing
        Noti = Notification()
        Noti.SendNewListVerification(listingID)


        audit_query = """
                INSERT INTO AuditLog (UserID, ActionID, IPAddress, UserAgent, SessionID)
                VALUES (%s, %s, %s, %s, %s)
            """

        values = (self.UserID, 3, self.sessionIP, "Unknown", self.sessionID)

        cursor.execute(audit_query, values)
        conn.commit()

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

        audit_query = """
                INSERT INTO AuditLog (UserID, ActionID, IPAddress, UserAgent, SessionID)
                VALUES (%s, %s, %s, %s, %s)
            """

        values = (self.UserID, 5, self.sessionIP, "Unknown", self.sessionID)

        cursor.execute(audit_query, values)
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
        

        #Send notification when admin approves listing
        #Noti = Notification(3,listingID)

        audit_query = """
                INSERT INTO AuditLog (UserID, ActionID, IPAddress, UserAgent, SessionID)
                VALUES (%s, %s, %s, %s, %s)
            """

        values = (self.UserID, 4, self.sessionIP, "Unknown", self.sessionID)

        cursor.execute(audit_query, values)
        conn.commit()

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
                Status="Returned"
            WHERE UserID=%s
            """

        values = (listingID)
        cursor.execute(query, values)

        conn.commit()

        audit_query = """
                INSERT INTO AuditLog (UserID, ActionID, IPAddress, UserAgent, SessionID)
                VALUES (%s, %s, %s, %s, %s)
            """

        values = (self.UserID, 4, self.sessionIP, "Unknown", self.sessionID)

        cursor.execute(audit_query, values)
        conn.commit()

        cursor.close()
        conn.close()

        return 1
    
    def Claim(self, listingID: int, ImageID: int, description: str):
        """
        Claim an item the user believes is theirs and upload the required proof.
        
        Args:
            self(User): Class object
            listingID(int): Id of the listing the user is claiming
            ImageID(int): ImageID for the image used as verification
            description(str): Description/explanation for the claim
            
        Returns:
            int: Status code indicating result:
                0 = Success - claim filed successfully
                1 = Error - user has already filed a claim for this listing
                2 = Error - listing not found 
                3 = Error - user cannot claim their own listing
                4 = Error - already claimed by someone else
                5 = Error - database error
        """

        conn = self.get_connection()
        cursor = conn.cursor()
            
        # Check if listing exists and get its details
        listing_check_query = """
                SELECT UserID, ClaimantID, Status 
                FROM Listings 
                WHERE ListingID = %s
            """
        cursor.execute(listing_check_query, (listingID,))
        listing_result = cursor.fetchone()

        # Exit if listing does not exist  
        if not listing_result:
            return 2  
                
        listing_owner_id, current_claimant_id, listing_status = listing_result
        
        # Check if user is trying to claim their own listing
        if listing_owner_id == self.UserID:
            return 3  
                
        # Check if listing is already claimed by someone else
        if current_claimant_id is not None and current_claimant_id != self.UserID:
            return 4  
                
                
        # Check if user has already filed a claim for this listing
        existing_claim_query = """
                SELECT ClaimID 
                FROM Claims 
                WHERE ClaimantID = %s AND ListingID = %s
            """
        cursor.execute(existing_claim_query, (self.UserID, listingID))
        existing_claim = cursor.fetchone()
            
        if existing_claim:
            return 1  
            
        # Create the claim as all checks have passed
        insert_claim_query = """
                INSERT INTO Claims 
                (ImageID, ClaimantID, ListingID, Description)
                VALUES (%s, %s, %s, %s)
            """
        values = (ImageID, self.UserID, listingID, description)
        cursor.execute(insert_claim_query, values)
            
        # Update the listing to mark it as having a pending claim

        update_listing_query = """
                UPDATE Listings 
                SET Status = 'Pending Claim' 
                WHERE ListingID = %s AND Status != 'Claimed'
            """
        cursor.execute(update_listing_query, (listingID,))
            
        conn.commit()
        claimID = cursor.lastrowid
            
        # Log the action in audit log
        audit_query = """
                INSERT INTO AuditLog (UserID, ActionID, IPAddress, UserAgent, SessionID)
                VALUES (%s, %s, %s, %s, %s)
            """

        values = (self.UserID, 6, self.sessionIP, "Unknown", self.sessionID)

        cursor.execute(audit_query, values)
        conn.commit()
            

        #Noti = Notification(5, claimID=claimID)

        cursor.close()
        conn.close()

        return 0

    def ContactUser(self, participant2ID):
        """ Opens the message history between two users
            Args:
                self: Class Object
                participant2ID(int): Id of the other user who the current user wishes to contact
            Returns:
                Contents of text thread as well as the threadID
        """

        
        if self.UserID != participant2ID:
            
            conn = self.get_connection()
            cursor = conn.cursor()

            query = """ SELECT * FROM Users
                        WHERE UserID = %s"""
            
            values = (participant2ID,)

            cursor.execute(query, values)

            row = cursor.fetchone()
            if row is None:
                return None

            #Normalizes the interaction between the two users to prevent duplication
            # 3 contacting 7 is same interaction as 7 contacting 3
            user_1 = min(self.UserID,participant2ID)
            user_2 = max(self.UserID,participant2ID)

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
            
            values = (messageID,)

            cursor.execute(query, values)

            row = cursor.fetchone()

            cursor.close()
            conn.close()


            print(f"Row {row}")

            if(row is None):
                self.CreateMessageThread(messageID, user_1, user_2)


            subfolder = "MessageThreads"
            filename = str(messageID) + ".json"
            filepath = os.path.join(subfolder, filename)

            content = None

            print(f"Looking for file {filepath}")

            with open(filepath, "r") as file:
                content = self.decrypt(user_1, user_2, f"{filepath}")
            
            return content, messageID, 1

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

       

        #Create the file with the unique primary key as title
        subfolder = "MessageThreads"
        filename = str(threadId) + ".json"
        filepath = os.path.join(subfolder, filename)

        os.makedirs(subfolder, exist_ok=True)

        # Write to the file inside the subfolder
        with open(filepath, "w") as f:
            #out = f"Message thread between {party1} and {party2}.\n"
            self.encrypt(party1,party2,"",filepath)
            #json.dump(out, f, indent=2)

        # Log the action in audit log
        audit_query = """
                INSERT INTO AuditLog (UserID, ActionID, IPAddress, UserAgent, SessionID)
                VALUES (%s, %s, %s, %s, %s)
            """

        values = (self.UserID, 7, self.sessionIP, "Unknown", self.sessionID)

        cursor.execute(audit_query, values)
        conn.commit()

        cursor.close()
        conn.close()
    
    def SendMessage(self, messageID: int, recipient:int, contents: str):
        """Send a message to another user.
            Args: 
                messageID(int):     Unique ID for the interaction between the two users
                contents(str):      The message being sent
        """
        
        conn = self.get_connection()
        cursor = conn.cursor()


        self.encrypt(self.UserID, recipient, contents, f"{messageID}.")


        audit_query = """
                INSERT INTO AuditLog (UserID, ActionID, IPAddress, UserAgent, SessionID)
                VALUES (%s, %s, %s, %s, %s)
            """

        values = (self.UserID, 7, self.sessionIP, "Unknown", self.sessionID)

        noti = Notification()

        cursor.execute(audit_query, values)
        conn.commit()

        cursor.close()
        conn.close()

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
        with open(f"{filename}", 'r') as f:
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
            existing_content = ""
        
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
        with open(f"{filename}", 'w') as f:
            json.dump(out, f, indent=2)
        
        return 1
    