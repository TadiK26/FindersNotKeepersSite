import mysql.connector
import os
import json
import base64
import hashlib
import uuid
from datetime import datetime
from typing import Optional, Dict, List, Any
import hashlib
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from dotenv import load_dotenv
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
                5 = Error - database error0
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

    # ==================== API Response Standardization ====================  
    def api_response(self, success: bool, data: Any = None, error: str = None, code: int = 200) -> Dict:
        """
        Standardized API response format for frontend consumption
        
        Args:
            success: Whether the operation succeeded
            data: Response data (dict, list, etc.)
            error: Error message if operation failed
            code: HTTP-like status code
            
        Returns:
            Standardized response dictionary
        """
        return {
            "success": success,
            "data": data,
            "error": error,
            "timestamp": datetime.utcnow().isoformat(),
            "code": code
        }
    
    # ==================== Input Validation ====================
    
    def validate_message_content(self, contents: str) -> Dict:
        """
        Validate message content before sending
        
        Args:
            contents: Message text to validate
            
        Returns:
            Validation result with success status and error message if invalid
        """
        if not contents:
            return {"valid": False, "error": "Message cannot be empty"}
        
        if not isinstance(contents, str):
            return {"valid": False, "error": "Message must be a string"}
        
        if len(contents.strip()) == 0:
            return {"valid": False, "error": "Message cannot be empty or whitespace only"}
        
        if len(contents) > 10000:
            return {"valid": False, "error": "Message too long (max 10,000 characters)"}
        
        # Check for potentially malicious content
        if '<script' in contents.lower() or 'javascript:' in contents.lower():
            return {"valid": False, "error": "Message contains potentially unsafe content"}
        
        return {"valid": True}
    
    def validate_user_id(self, user_id: int) -> Dict:
        """
        Validate user ID
        
        Args:
            user_id: User ID to validate
            
        Returns:
            Validation result
        """
        if not isinstance(user_id, int):
            return {"valid": False, "error": "User ID must be an integer"}
        
        if user_id <= 0:
            return {"valid": False, "error": "User ID must be positive"}
        
        return {"valid": True}
    
    # ==================== Structured Message Format ====================
    
    def create_message_object(self, sender_id: int, content: str, message_id: str = None) -> Dict:
        """
        Create a structured message object with metadata
        
        Args:
            sender_id: ID of the user sending the message
            content: Message content
            message_id: Optional custom message ID, generates UUID if not provided
            
        Returns:
            Structured message dictionary
        """
        return {
            "message_id": message_id or str(uuid.uuid4()),
            "sender_id": sender_id,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
            "read": False,
            "edited": False,
            "deleted": False
        }
    
    def parse_messages_from_content(self, content: str) -> List[Dict]:
        """
        Parse JSON content into structured message list
        
        Args:
            content: Decrypted content string
            
        Returns:
            List of message dictionaries
        """
        if not content or content.strip() == "":
            return []
        
        try:
            messages = json.loads(content)
            if isinstance(messages, list):
                return messages
            elif isinstance(messages, dict):
                return [messages]
            else:
                return []
        except (json.JSONDecodeError, ValueError):
            # Handle legacy format or corrupted data
            return []
    
    # ==================== Contact User with Structured Data ====================
    
    def ContactUser(self, participant2ID: int, limit: int = 50, offset: int = 0) -> Dict:
        """
        Opens the message history between two users with pagination
        
        Args:
            participant2ID: ID of the other user
            limit: Number of messages to return (default 50)
            offset: Number of messages to skip for pagination (default 0)
            
        Returns:
            Standardized API response with thread data and messages
        """
        try:
            # Validate inputs
            if self.UserID == participant2ID:
                return self.api_response(
                    False, 
                    error="Cannot message yourself", 
                    code=400
                )
            
            user_validation = self.validate_user_id(participant2ID)
            if not user_validation["valid"]:
                return self.api_response(
                    False, 
                    error=user_validation["error"], 
                    code=400
                )
            
            # Validate pagination parameters
            if limit <= 0 or limit > 100:
                return self.api_response(
                    False, 
                    error="Limit must be between 1 and 100", 
                    code=400
                )
            
            if offset < 0:
                return self.api_response(
                    False, 
                    error="Offset must be non-negative", 
                    code=400
                )
            
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Verify participant2 exists
            query = "SELECT * FROM Users WHERE UserID = %s"
            cursor.execute(query, (participant2ID,))
            row = cursor.fetchone()
            
            if row is None:
                cursor.close()
                conn.close()
                return self.api_response(
                    False, 
                    error="Recipient user not found", 
                    code=404
                )
            
            # Normalize interaction between users
            user_1 = min(self.UserID, participant2ID)
            user_2 = max(self.UserID, participant2ID)
            
            # Generate thread ID using Cantor pairing
            cantor_pair = int((user_1**2 + user_1 + 2*user_1*user_2 + 3*user_2 + user_2**2)/2)
            letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            letter_pair = ""
            n = cantor_pair
            for i in range(4):
                letter_pair = letters[n % 26] + letter_pair
                n //= 26
            messageID = f"{letter_pair}_{cantor_pair}"
            
            # Check if thread exists in database
            query = "SELECT * FROM MessageThread WHERE ThreadID = %s"
            cursor.execute(query, (messageID,))
            row = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            # Create thread if it doesn't exist
            if row is None:
                create_result = self.CreateMessageThread(messageID, user_1, user_2)
                if not create_result["success"]:
                    return create_result
            
            # Read and decrypt message file
            subfolder = "MessageThreads"
            filename = str(messageID) + ".json"
            filepath = os.path.join(subfolder, filename)
            
            if not os.path.exists(filepath):
                return self.api_response(
                    False, 
                    error="Thread file not found", 
                    code=404
                )
            
            # Decrypt and parse messages
            content = self.decrypt(user_1, user_2, filepath)
            messages = self.parse_messages_from_content(content)
            
            # Sort messages by timestamp (newest first for pagination)
            messages_sorted = sorted(
                messages, 
                key=lambda x: x.get('timestamp', ''), 
                reverse=True
            )
            
            # Apply pagination
            total_count = len(messages_sorted)
            paginated_messages = messages_sorted[offset:offset + limit]
            has_more = offset + limit < total_count
            
            # Return structured response
            return self.api_response(
                True,
                data={
                    "thread_id": messageID,
                    "participant1_id": user_1,
                    "participant2_id": user_2,
                    "current_user_id": self.UserID,
                    "messages": paginated_messages,
                    "pagination": {
                        "total_count": total_count,
                        "limit": limit,
                        "offset": offset,
                        "has_more": has_more,
                        "returned_count": len(paginated_messages)
                    }
                },
                code=200
            )
            
        except PermissionError:
            return self.api_response(
                False, 
                error="Permission denied accessing message thread", 
                code=403
            )
        except FileNotFoundError:
            return self.api_response(
                False, 
                error="Thread file not found", 
                code=404
            )
        except Exception as e:
            # Log the error (implement proper logging)
            print(f"Error in ContactUser: {str(e)}")
            return self.api_response(
                False, 
                error="Internal server error", 
                code=500
            )
    
    # ==================== Create Message Thread ====================
    
    def CreateMessageThread(self, threadId: str, party1: int, party2: int) -> Dict:
        """
        Create a message thread between 2 users
        
        Args:
            threadId: Unique thread identifier
            party1: User ID with lowest absolute value
            party2: User ID with highest absolute value
            
        Returns:
            Standardized API response
        """
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Create database entry
            query = """
                INSERT INTO MessageThread 
                (ThreadID, Participant1, Participant2, DateOfCreation)
                VALUES(%s, %s, %s, NOW())
            """
            values = (threadId, party1, party2)
            cursor.execute(query, values)
            conn.commit()
            
            # Create encrypted file with empty message array
            subfolder = "MessageThreads"
            filename = str(threadId) + ".json"
            filepath = os.path.join(subfolder, filename)
            os.makedirs(subfolder, exist_ok=True)
            
            # Initialize with empty message array
            empty_messages = json.dumps([])
            self.encrypt(party1, party2, empty_messages, filepath)
            
            # Log the action in audit log
            audit_query = """
                INSERT INTO AuditLog (UserID, ActionID, IPAddress, UserAgent, SessionID, Timestamp)
                VALUES (%s, %s, %s, %s, %s, NOW())
            """
            values = (self.UserID, 7, self.sessionIP, "Unknown", self.sessionID)
            cursor.execute(audit_query, values)
            conn.commit()
            
            cursor.close()
            conn.close()
            
            return self.api_response(
                True,
                data={
                    "thread_id": threadId,
                    "participant1_id": party1,
                    "participant2_id": party2,
                    "created_at": datetime.utcnow().isoformat()
                },
                code=201
            )
            
        except Exception as e:
            print(f"Error creating message thread: {str(e)}")
            return self.api_response(
                False,
                error="Failed to create message thread",
                code=500
            )
    
    # ==================== Send Message with Validation ====================
    
    def SendMessage(self, messageID: str, recipient: int, contents: str) -> Dict:
        """
        Send a message to another user with validation
        
        Args:
            messageID: Thread ID for the conversation
            recipient: ID of the recipient user
            contents: Message content
            
        Returns:
            Standardized API response
        """
        try:
            # Validate recipient ID
            user_validation = self.validate_user_id(recipient)
            if not user_validation["valid"]:
                return self.api_response(
                    False,
                    error=user_validation["error"],
                    code=400
                )
            
            # Validate message content
            content_validation = self.validate_message_content(contents)
            if not content_validation["valid"]:
                return self.api_response(
                    False,
                    error=content_validation["error"],
                    code=400
                )
            
            # Verify user cannot message themselves
            if self.UserID == recipient:
                return self.api_response(
                    False,
                    error="Cannot send message to yourself",
                    code=400
                )
            
            # Verify recipient exists
            conn = self.get_connection()
            cursor = conn.cursor()
            
            query = "SELECT * FROM Users WHERE UserID = %s"
            cursor.execute(query, (recipient,))
            row = cursor.fetchone()
            
            if row is None:
                cursor.close()
                conn.close()
                return self.api_response(
                    False,
                    error="Recipient user not found",
                    code=404
                )
            
            # Verify thread exists and user has permission
            query = """
                SELECT * FROM MessageThread 
                WHERE ThreadID = %s 
                AND (Participant1 = %s OR Participant2 = %s)
            """
            cursor.execute(query, (messageID, self.UserID, self.UserID))
            thread = cursor.fetchone()
            
            if thread is None:
                cursor.close()
                conn.close()
                return self.api_response(
                    False,
                    error="Thread not found or access denied",
                    code=403
                )
            
            # Create structured message object
            new_message = self.create_message_object(self.UserID, contents)
            
            # Read existing messages
            subfolder = "MessageThreads"
            filename = str(messageID) + ".json"
            filepath = os.path.join(subfolder, filename)
            
            user_1 = min(self.UserID, recipient)
            user_2 = max(self.UserID, recipient)
            
            # Decrypt existing messages
            existing_content = self.decrypt(user_1, user_2, filepath)
            messages = self.parse_messages_from_content(existing_content)
            
            # Append new message
            messages.append(new_message)
            
            # Encrypt updated message list
            updated_content = json.dumps(messages)
            self.encrypt(user_1, user_2, updated_content, filepath)
            
            # Log the action
            audit_query = """
                INSERT INTO AuditLog (UserID, ActionID, DateOfAudit, IPAddress, UserAgent, SessionID)
                VALUES (%s, %s, NOW(), %s, %s, %s)
            """
            values = (self.UserID, 8, self.sessionIP, "Unknown", self.sessionID)
            cursor.execute(audit_query, values)
            conn.commit()
            
            cursor.close()
            conn.close()
            
            return self.api_response(
                True,
                data={
                    "message": new_message,
                    "thread_id": messageID
                },
                code=201
            )
            
        except FileNotFoundError:
            return self.api_response(
                False,
                error="Thread file not found",
                code=404
            )
        except PermissionError:
            return self.api_response(
                False,
                error="Permission denied",
                code=403
            )
        except Exception as e:
            print(f"Error sending message: {str(e)}")
            return self.api_response(
                False,
                error="Failed to send message",
                code=500
            )
    
    # ==================== Encryption Methods ====================
    
    def generateKey(self, id1: int, id2: int) -> bytes:
        """
        Generate encryption key from user IDs
        
        Args:
            id1: First user ID
            id2: Second user ID
            
        Returns:
            32-byte encryption key
        """
        # Sort so that either user can supply ids in any order
        a, b = sorted([int(id1), int(id2)])
        shared = f"{a}:{b}".encode('utf-8')
        
        # Deterministic "salt" derived from the ids
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
        Decrypt a file and return its contents as a plain text string
        
        Args:
            id1: First user ID
            id2: Second user ID
            filename: Path to the encrypted file
            
        Returns:
            Decrypted contents as a string
        """
        with open(filename, 'r') as f:
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
    
    def encrypt(self, id1: int, id2: int, plaintext: str, filename: str) -> int:
        """
        Encrypt plaintext and write to file (overwrites existing content)
        
        Args:
            id1: First user ID
            id2: Second user ID
            plaintext: Text to encrypt (should be JSON string of message array)
            filename: Path to write encrypted file
            
        Returns:
            1 on success
        """
        # Encrypt the content
        key = self.generateKey(id1, id2)
        aesgcm = AESGCM(key)
        nonce = os.urandom(12)  # 96-bit nonce for AES-GCM
        ct = aesgcm.encrypt(nonce, plaintext.encode('utf-8'), associated_data=None)
        
        # Package data needed for decryption
        out = {
            "ids_sorted": ":".join(map(str, sorted([int(id1), int(id2)]))),
            "salt_hex": hashlib.sha256(
                f"{min(int(id1), int(id2))}:{max(int(id1), int(id2))}".encode()
            ).digest()[:16].hex(),
            "nonce_b64": base64.b64encode(nonce).decode('utf-8'),
            "ciphertext_b64": base64.b64encode(ct).decode('utf-8'),
            "kdf_info": "HKDF-SHA256 length=32 info='two-id-comm-key' deterministic-salt-from-ids"
        }
        
        # Write encrypted content to file
        with open(filename, 'w') as f:
            json.dump(out, f, indent=2)
        
        return 1