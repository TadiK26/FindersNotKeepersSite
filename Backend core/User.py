import mysql.connector
import bcrypt
from datetime import date

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
    
    def MakeListing(self):
        """Create a new item listing."""
        pass
    
    def RemoveListing(self):
        """Remove an existing listing."""
        pass
    
    def UpdateListing(self):
        """Update an existing listing."""
        pass
    
    def MarkReturned(self):
        """Mark an item as returned to its owner."""
        pass
    
    def MarkClaimed(self):
        """Mark an item as claimed by the owner."""
        pass
    
    def SendMessage(self):
        """Send a message to another user."""
        pass
