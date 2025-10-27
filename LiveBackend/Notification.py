import smtplib
import os
import psycopg2
import psycopg2.extras
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

class Notification:
    """Handles sending notifications to users."""
    
    @staticmethod
    def get_connection():
        load_dotenv()

        return psycopg2.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            dbname="findersnotkeepers"
        )  

    def SendNewListingNoti(self, listID: int):
        """Notify all users (who want listing notifications) when a new item is posted."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            cursor.execute("SELECT * FROM Listings WHERE ListingID = %s", (listID,))
            listing = cursor.fetchone()

            if listing:
                title = listing['ItemTitle']

                cursor.execute("SELECT Email, NotificationPreference FROM Users WHERE Role = 'USER'")
                line = f"New Listing\nTitle: {title}\nDescription: {listing['Description']}\nLocation: {listing['LocationLost']}"
                for row in cursor.fetchall():
                    notiPref = row['NotificationPreference']
                    if (notiPref == 2 or notiPref == 3 or notiPref == 7 or notiPref == 8):
                        self.send_email(row['Email'], f"New Listing: {title}", line)

            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error in SendNewListingNoti: {e}")

    def SendVerificationReq(self, ImageID: int, ListingID: int, ClaimaintID: int, ItemDescription: str, ClaimDescription: str):
        """Send claim verification request to admins."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            cursor.execute("SELECT Email FROM Users WHERE Role = 'ADMIN'")
            for row in cursor.fetchall():
                subject = "Claim Verification Needed"
                body = (f"A claim requires verification.\n"
                        f"ListingID: {ListingID} | {ItemDescription},\nClaimantID: {ClaimaintID},\nImageID: {ImageID},\nClaim Description: {ClaimDescription}")
                self.send_email(row['Email'], subject, body)

            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error in SendVerificationReq: {e}")

    def sendMessageNoti(self, recipient, contents, username):
        """Notify a user they received a new message."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            cursor.execute("SELECT Email, NotificationPreference FROM Users WHERE UserID = %s", (recipient,))
            record = cursor.fetchone()

            if record is not None:
                line = "--------------------------------------------------------------------------------"
                formatText = f"Message from {username} \n\n {line}\n\n{contents}\n\n{line}"
                NotiPref = record['NotificationPreference']

                if(NotiPref == 2 or NotiPref == 4 or NotiPref == 6 or NotiPref == 8):
                    self.send_email(record['Email'], f"New Message from {username}", formatText)

            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error in sendMessageNoti: {e}")

    def SendNewListVerification(self, listingID: int):
        """Send new listing verification request to admins."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            cursor.execute("SELECT Email FROM Users WHERE Role = 'ADMIN'")
            for row in cursor.fetchall():
                self.send_email(row['Email'], "Listing Verification Request",
                                f"Listing {listingID} requires verification.")

            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error in SendNewListVerification: {e}")

    def sendToAdmin(self, message: str, adminID: int):
        """Send direct message to a specific admin."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            cursor.execute("SELECT Email FROM Users WHERE UserID = %s AND Role = 'ADMIN'", (adminID,))
            record = cursor.fetchone()
            if record:
                self.send_email(record['Email'], "User Message", message)

            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error in sendToAdmin: {e}")

    def send_email(self, recipient_email, subject, body):
        load_dotenv()

        SMTP_SERVER = "smtp.gmail.com"
        SMTP_PORT = 587
        EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
        EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
        DISPLAY_NAME = "Finders Not Keepers"

        try:
            msg = MIMEMultipart()
            msg['From'] = f"{DISPLAY_NAME} <{EMAIL_ADDRESS}>"
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
