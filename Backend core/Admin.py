import mysql.connector
from User import User
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
    
    
    def ApproveProof(self,claimID):
        """Approve proof of ownership for an item."""

        conn = self.get_connection()
        cursor = conn.cursor()

        query = """
            SELECT ListingID, ClaimantID
            FROM   Claims
            WHERE ClaimID = %s
            """

        values = (claimID,)
        cursor.execute(query, values)
        row = cursor.fetchone()
        print(row)
        listingID = row[0]
        claimantID = row[1]


        query = """
            UPDATE Listings SET
                Status = "Claimed", ClaimantID = %s, CloseDate = NOW()
            WHERE ListingID=%s
            """

        values = (claimantID,listingID,)
        cursor.execute(query, values)
        conn.commit()

        #Notify claimant of approval


        query = """
            SELECT ClaimantID
            FROM   Claims
            WHERE ListingID = %s AND NOT ClaimantID = %s
            """

        values = (listingID,claimantID,)
        cursor.execute(query, values)
        row = cursor.fetchall()
        print(row)

        #Notify other users that item has been succesfuuly claimed by someone else

        query = """
            DELETE FROM Claims
            WHERE  ListingID = %s
            """
        values = (listingID,)
        cursor.execute(query, values)
  

        # Log the action in audit log
        audit_query = """
                INSERT INTO AuditLog (UserID, ActionID, IPAddress, UserAgent, SessionID)
                VALUES (%s, %s, %s, %s, %s)
            """

        values = (self.UserID, 4, self.sessionIP, "Unknown", self.sessionID)

        cursor.execute(audit_query, values)
        conn.commit()

    def DeclineProof(self,claimID):
        """Approve proof of ownership for an item."""

        conn = self.get_connection()
        cursor = conn.cursor()

        query = """
            SELECT ListingID, ClaimantID
            FROM   Claims
            WHERE ClaimID = %s
            """

        values = (claimID,)
        cursor.execute(query, values)
        row = cursor.fetchone()

        print(row)
        listingID = row[0]
        claimantID = row[1]

        #notify claimant approval was denied

        query = """
            SELECT ClaimantID
            FROM   Claims
            WHERE ListingID = %s
            """

        values = (listingID,)
        cursor.execute(query, values)
        row = cursor.fetchone()



        # Log the action in audit log
        audit_query = """
                INSERT INTO AuditLog (UserID, ActionID, IPAddress, UserAgent, SessionID)
                VALUES (%s, %s, %s, %s, %s)
            """

        values = (self.UserID, 4, self.sessionIP, "Unknown", self.sessionID)

        cursor.execute(audit_query, values)
        conn.commit()

    def ApproveListing(self, listingID):
        """Approve a new item listing."""

        conn = self.get_connection()
        cursor = conn.cursor()


        query = """
            UPDATE Listings SET
                Status= "Active"
            WHERE ListingID=%s
            """

        values = (listingID)
        cursor.execute(query, values)
        conn.commit()

        #Notify User that listing was denied

        # Log the action in audit log
        audit_query = """
                INSERT INTO AuditLog (UserID, ActionID, IPAddress, UserAgent, SessionID)
                VALUES (%s, %s, %s, %s, %s)
            """

        values = (self.UserID, 4, self.sessionIP, "Unknown", self.sessionID)

        cursor.execute(audit_query, values)
        conn.commit()

        pass
    
    def DeclineListing(self, listingID, reasoning: str):
        """Approve a new item listing."""

        conn = self.get_connection()
        cursor = conn.cursor()


        query = """
            UPDATE Listings SET
                Status= "Closed"
            WHERE ListingID=%s
            """

        values = (listingID)
        cursor.execute(query, values)
        conn.commit()

        #Notify User that listing was denied

        # Log the action in audit log
        audit_query = """
                INSERT INTO AuditLog (UserID, ActionID, IPAddress, UserAgent, SessionID)
                VALUES (%s, %s, %s, %s, %s)
            """

        values = (self.UserID, 4, self.sessionIP, "Unknown", self.sessionID)

        cursor.execute(audit_query, values)
        conn.commit()

        pass
    
    def GetLogs(self, searchQuery:str):

        message = "Admin request for activity logs"
        print(message)
        #sender = Notification(6,message=message)
        pass
    
    def GenerateReport(self, searchQuery:str):
        """Generate administrative reports."""

        #message = "Admin request for user report"
        #sender = Notification()
        pass

        #sender.SendAdminNoti()
        
