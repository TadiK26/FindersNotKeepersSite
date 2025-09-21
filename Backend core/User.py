import mysql.connector
import os
from datetime import date

from Notification import Notification

#Represents a user in the system
class User:
    def __init__(self, UserID=None, Username=None, Lastname=None, Firstnames=None,
                 Email=None, UP_ID=None, PasswordHash=None, Role=None,
                 NotificationPreference=0, DateOfCreation=None,
                 CreationMethod=None, PhoneNumber=None,
                 LastLoginDate=None, ProfileImageID=None):
        
        self.UserID = UserID
        self.Username = Username
        self.Lastname = Lastname
        self.Firstnames = Firstnames
        self.Email = Email
        self.UP_ID = UP_ID
        self.PasswordHash = PasswordHash
        self.Role = Role
        self.NotificationPreference = NotificationPreference
        self.DateOfCreation = DateOfCreation
        self.CreationMethod = CreationMethod
        self.PhoneNumber = PhoneNumber
        self.LastLoginDate = LastLoginDate
        self.ProfileImageID = ProfileImageID

    #Connect to the database
    @staticmethod
    def get_connection():
        return mysql.connector.connect(
            host="localhost",
            user="root",
            password="tadiwanashe",
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

        """Mark an item as returned to its owner.
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
        """ Opens message history between two users
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

            query = """ SELECT * FROM MessageThread
                        WHERE Participant1 = %s AND Participant2 = %s
                    """
            
            values = (user_1, user_2)

            cursor.execute(query, values)

            row = cursor.fetchone()

            cursor.close()
            conn.close()

            threadID = None

            if(row is None):
                threadID = self.CreateMessageThread()
            else:
                threadID = row['ThreadID']

            subfolder = "MessageThreads"
            filename = str(threadID) + "_messages.txt"
            filepath = os.path.join(subfolder, filename)

            content = None

            with open(filepath, "r") as file:
                content = file.read()
            
            return content,threadID

        else:
            return None
      
    def CreateMessageThread(self,party1: int, party2: int):
        """Create a message thread between 2 users
            Args:
                party1(int): user id with lowest absolute value 
                party2(int): user id with highest absolute value
            Returns:
                int: the id of the newly created message thread
        """

        conn = self.get_connection()
        cursor = conn.cursor()

        #Create an entry of the message thread
        query = """ INSERT INTO MessageThread 
                    (Participant1, Participant2)
                    VALUES(%s,%s)
                """
            
        values = (party1, party2)
        cursor.execute(query, values) 
        conn.commit()

        messageID = cursor.lastrowid

        cursor.close()
        conn.close()

        #Create the file with the unique primary key as title
        subfolder = "MessageThreads"
        filename = str(messageID) + "_messages.txt"
        filepath = os.path.join(subfolder, filename)

        # Create the message thread subfolder if it doesn't exist
        os.makedirs(subfolder, exist_ok=True)

        # Write to the file inside the subfolder
        with open(filepath, "w") as file:
            file.write("This file is saved inside a subfolder.\n")
            file.write("Each interaction can be logged here.\n")

        return messageID
    
    def SendMessage(self, messageID: int, recipient: int, contents: str):
        """Send a message to another user."""
        
        conn = self.get_connection()
        cursor = conn.cursor()
