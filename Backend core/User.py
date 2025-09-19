import mysql.connector
from datetime import date

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
        self.DateOfCreation = DateOfCreation or date.today()
        self.CreationMethod = CreationMethod
        self.PhoneNumber = PhoneNumber
        self.LastLoginDate = LastLoginDate
        self.ProfileImageID = ProfileImageID

    # --- Database Connection ---
    @staticmethod
    def get_connection():
        return mysql.connector.connect(
            host="localhost",
            user="root",
            password="tadiwanashe",
            database="findersnotkeepers"
        )

    # --- Insert User ---
    def save(self):
        conn = self.get_connection()
        cursor = conn.cursor()

        if self.UserID is None:
            # Insert new user
            query = """
            INSERT INTO Users 
            (Username, Lastname, Firstnames, Email, UP_ID, PasswordHash, Role, 
             NotificationPreference, DateOfCreation, CreationMethod, PhoneNumber, 
             LastLoginDate, ProfileImageID)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (self.Username, self.Lastname, self.Firstnames, self.Email,
                      self.UP_ID, self.PasswordHash, self.Role, self.NotificationPreference,
                      self.DateOfCreation, self.CreationMethod, self.PhoneNumber,
                      self.LastLoginDate, self.ProfileImageID)
            cursor.execute(query, values)
            self.UserID = cursor.lastrowid
        else:
            # Update existing user
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
            cursor.execute(query, values)

        conn.commit()
        cursor.close()
        conn.close()

    # --- Fetch User by ID ---
    @classmethod
    def get_by_id(cls, user_id):
        conn = cls.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Users WHERE UserID = %s", (user_id,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        return cls(**row) if row else None

    # --- Fetch User by Username ---
    @classmethod
    def get_by_username(cls, username):
        conn = cls.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Users WHERE Username = %s", (username,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        return cls(**row) if row else None

    def __repr__(self):
        return f"<User(UserID={self.UserID}, Username='{self.Username}', Email='{self.Email}')>"
