import smtplib 
import os
import mysql.connector
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

class Notification:
    """Handles sending notifications to users."""
    
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
        """Notify the owner of a listing when someone claims their item."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute("""
                SELECT u.Email, l.ItemTitle
                FROM Claims c
                JOIN Listings l ON c.ListingID = l.ListingID
                JOIN Users u ON l.UserID = u.UserID
                WHERE c.ClaimID = %s
            """, (self.claimID,))
            record = cursor.fetchone()

            if record:
                email = record['Email']
                title = record['ItemTitle']
                subject = "New Claim on Your Listing"
                body = f"Someone has claimed your item: {title}. Please log in to review the claim."
                self._send_if_allowed(email, subject, body, [2, 5, 6, 7])
            
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error in SendClaimNoti: {e}")


    def SendMatchNoti(self):
        """Notify the claimant if a potential match is found."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute("""
                SELECT u.Email
                FROM Claims c
                JOIN Users u ON c.ClaimantID = u.UserID
                WHERE c.ClaimID = %s
            """, (self.claimID,))
            record = cursor.fetchone()

            if record:
                subject = "Potential Match Found"
                body = "We found a potential match for your claim. Please log in to check the details."
                self._send_if_allowed(record['Email'], subject, body, [2])  # all-email only
            
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error in SendMatchNoti: {e}")


    def SendNewListingNoti(self, listID: int):
        """Notify all users (who want listing notifications) when a new item is posted."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute("SELECT ItemTitle FROM Listings WHERE ListingID = %s", (listID,))
            listing = cursor.fetchone()

            if listing:
                title = listing['ItemTitle']

                cursor.execute("SELECT Email, NotificationPreference FROM Users")
                for row in cursor.fetchall():
                    self._send_if_allowed(row['Email'],
                        "New Listing Added",
                        f"A new item has been listed: {title}.",
                        [2, 3, 7, 8]
                    )

            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error in SendNewListingNoti: {e}")


    def SendAdminNoti(self):
        """Send a broadcast admin message to all users."""
        if not self.message:
            return
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute("SELECT Email FROM Users")
            for row in cursor.fetchall():
                self.send_email(row['Email'], "Admin Notification", self.message)

            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error in SendAdminNoti: {e}")


    def SendVerificationReq(self, ImageID: int, ListingID: int, ClaimaintID: int):
        """Send claim verification request to admins."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute("SELECT Email FROM Users WHERE Role = 'admin'")
            for row in cursor.fetchall():
                subject = "Claim Verification Needed"
                body = (f"A claim requires verification.\n"
                        f"ListingID: {ListingID}, ClaimantID: {ClaimaintID}, ImageID: {ImageID}")
                self.send_email(row['Email'], subject, body)

            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error in SendVerificationReq: {e}")


    def sendMessageNoti(self):
        """Notify a user they received a new message."""
        if not self.message:
            return
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute("SELECT Email, NotificationPreference FROM Users WHERE UserID = %s", (self.claimantID,))
            record = cursor.fetchone()

            if record:
                self._send_if_allowed(record['Email'], "New Message", self.message, [2, 4, 6, 8])

            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error in sendMessageNoti: {e}")


    def SendNewListVerification(self, listingID: int):
        """Send new listing verification request to admins."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute("SELECT Email FROM Users WHERE Role = 'admin'")
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
            cursor = conn.cursor(dictionary=True)

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
