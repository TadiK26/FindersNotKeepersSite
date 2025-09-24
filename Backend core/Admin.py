import mysql.connector
import User

class Admin(User):
    def __init__(self, UserID=None, Username=None, Lastname=None, Firstnames=None,
                 Email=None, UP_ID=None, PasswordHash=None, Role=None,
                 NotificationPreference=0, DateOfCreation=None,
                 CreationMethod=None, PhoneNumber=None,
                 LastLoginDate=None, ProfileImageID=None):
    
        super().__init__(UserID, Username, Lastname, Firstnames,
                 Email, UP_ID, PasswordHash, Role,
                 NotificationPreference, DateOfCreation,
                 CreationMethod, PhoneNumber,
                 LastLoginDate, ProfileImageID)
    
    def ReviewProof(self):
        """Review proof of ownership for an item."""
        
        pass
    
    def ApproveProof(self,listingID):
        """Approve proof of ownership for an item."""

        conn = self.get_connection()
        cursor = conn.cursor()

        query = """
            UPDATE Listings SET
                Status= "Approved"
            WHERE ListingID=%s
            """

        values = (listingID)
        cursor.execute(query, values)
        conn.commit()
        
        pass
    
    def ApproveListing(self, listingID):
        """Approve a new item listing."""

        conn = self.get_connection()
        cursor = conn.cursor()

        query = """
            UPDATE Listings SET
                Status= "Approved"
            WHERE ListingID=%s
            """

        values = (listingID)
        cursor.execute(query, values)
        conn.commit()

        pass
    
    def GetLogs(self):
        """Retrieve system logs for auditing."""
        pass
    
    def GenerateReport(self):
        """Generate administrative reports."""
        pass
