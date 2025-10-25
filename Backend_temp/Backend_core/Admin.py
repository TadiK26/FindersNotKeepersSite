import mysql.connector
import User
from Notification import Notification

class Admin(User):
    def __init__(self, UserID=None, Username=None, Lastname=None, Firstnames=None,
                 Email=None,PasswordHash=None, Role=None,
                 NotificationPreference=0, DateOfCreation=None,
                 CreationMethod=None, LastLoginDate=None, ProfileImageID=None):
    
        super().__init__(UserID, Username, Lastname, Firstnames,
                 Email, PasswordHash, Role,
                 NotificationPreference, DateOfCreation,
                 CreationMethod, LastLoginDate, ProfileImageID)
    
    
    def ApproveProof(self,listingID):
        """Approve proof of ownership for an item."""

        conn = self.get_connection()
        cursor = conn.cursor()

        query = """
            UPDATE Listings SET
                Status= "Claimed", ClaimantID
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

        message = "Admin request for activity logs"
        sender = Notification(6,message=message)
    
    def GenerateReport(self):
        """Generate administrative reports."""

        message = "Admin request for user report"
        sender = Notification()

        sender.SendAdminNoti(message, self.userID)
        
