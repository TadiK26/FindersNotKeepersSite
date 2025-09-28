import smtplib 
import os
import mysql.connector
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

class Notification:
    """Handles sending notifications to users."""
    
    def __init__(self, notificationType: int, listId = None, imageID = None, claimantID = None, claimID = None, message = None):



        if notificationType == 1:
            self.SendClaimNoti()
        elif notificationType == 2:
            self.SendMatchNoti()
        elif notificationType == 3:
            self.SendNewListingNoti(listId)
        elif notificationType == 4:
            self.SendAdminNoti()
        elif notificationType == 5:
            self.SendVerificationReq(imageID, listId, claimantID)
        elif notificationType == 6:
            self.sendToAdmin()

    @staticmethod
    def get_connection():
        load_dotenv()

        return mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database="findersnotkeepers"
        )
    
    def SendClaimNoti(self):
        """Send notification when someone claims an item."""
        pass
    
    def SendMatchNoti(self):
        """Send notification when a potential match is found."""
        pass
    
    def SendNewListingNoti(self, listID: int):
        """Send notification about new item listings."""
        pass
    
    def SendAdminNoti(self):
        """Send notification from administrators to user"""
        pass

    def SendVerificationReq(self, ImageID: int, ListingID: int, ClaimaintID: int):
        """Send notification to administrators requesting claim verification"""


        
        #send_email()
        pass

    def SendNewListVerification(self, listingID):
        """Send notification to administrators requesting listing verification"""

        pass

    def sendToAdmin(self, message: str, adminID: int):
        """Sends a notification to an admin"""

        pass

    def send_email(self, recipient_email, subject, body):
        load_dotenv()

        SMTP_SERVER = "smtp.gmail.com"
        SMTP_PORT = 587
        EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
        EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

        print(EMAIL_ADDRESS)
        print(EMAIL_PASSWORD)

        try:
            msg = MIMEMultipart()
            msg['From'] = EMAIL_ADDRESS
            msg['To'] = recipient_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'plain'))

            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
                server.sendmail(EMAIL_ADDRESS, recipient_email, msg.as_string())

            print("Email send successfully")
        except Exception as e:
            print(f"Error sending email: {e}")