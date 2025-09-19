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
        self.DateOfCreation = date.today()
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
    
    #Register a new user
    def register(self,Username=None, Lastname=None, Firstnames=None,Email=None, 
                 UP_ID=None, PlainTextPassword=None, CreationMethod=None, 
                 PhoneNumber=None, ProfileImageID=1):
        conn = self.get_connection()
        cursor = conn.cursor()

        PasswordHash = PlainTextPassword

        query = """
            INSERT INTO Users 
            (Username, Lastname, Firstnames, Email, UP_ID, PasswordHash, Role, 
             NotificationPreference, CreationMethod, PhoneNumber, ProfileImageID)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
        values = (Username, Lastname, Firstnames, Email,
                      UP_ID, PasswordHash, "USER",1,
                      CreationMethod, PhoneNumber, ProfileImageID)
        
        cursor.execute(query, values)
        self.UserID = cursor.lastrowid

        conn.commit()
        cursor.close() 
        conn.close()

        self.loadProfile(userid=self.UserID)


    #Update user details
    def updateProfile(self):
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
        cursor.execute(query, values)

        conn.commit()
        cursor.close()
        conn.close()

    def loadProfile(self,username = None, email = None, userid = None):
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        

        row = None
        row = self.searchByEmail(email, cursor)
        if row is None:
        
            row = self.searchByUsername(username, cursor)
            if row is None:  
                row = self.searchByUserID(userid, cursor)
            
        

        if row is not None:
            self.UserID = int(row['UserID'])
            self.Username = str(row['Username'])
            self.Lastname = str(row['Lastname'])
            self.Firstnames = str(row['Firstnames'])
            self.Email = str(row['Email'])
            self.UP_ID = str(row['UP_ID'])
            self.PasswordHash = str(row['PasswordHash'])
            self.Role = str(row['Role'])
            self.NotificationPreference = int(row['NotificationPreference'])
            self.DateOfCreation = str(row['DateOfCreation'])
            self.CreationMethod = str(row['CreationMethod'])
            self.PhoneNumber = str(row['PhoneNumber'])
            self.LastLoginDate = str(row['LastLoginDate'])
            self.ProfileImageID = str(row['ProfileImageID'])
            
        print(self.__repr__)

        cursor.close() 
        conn.close()
    

    def searchByUsername(self,username,cursor):
        cursor.execute("SELECT * FROM Users WHERE Username = %s", (username,))
        
        return cursor.fetchone()
    
    def searchByEmail(self,email,cursor):
        cursor.execute("SELECT * FROM Users WHERE Email = %s", (email,))
        
        return cursor.fetchone()
    
    def searchByUserID(self,userID,cursor):
        cursor.execute("SELECT * FROM Users WHERE UserID = %s", (userID,))
        
        return cursor.fetchone()

    def __repr__(self):
        return f"<User(UserID={self.UserID}, Username='{self.Username}', Email='{self.Email}')>"
