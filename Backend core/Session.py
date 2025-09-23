import mysql.connector
import bcrypt
from User import User

#Handles user authentication and session management.
class Session:
    def __init__(self, sessionID, sessionIP):
        self.sessionID = sessionID
        self.sessionIP = sessionIP

    #Connect to the database
    @staticmethod
    def get_connection():
        return mysql.connector.connect(
            host="localhost",
            user="root",
            password="tadiwanashe",
            database="findersnotkeepers"
        )

    def register(self,Username=None, Lastname=None, Firstnames=None,Email=None, 
                 UP_ID=None, PlainTextPassword=None, CreationMethod=None, 
                 PhoneNumber=None, ProfileImageID=1):
        """
            Register a new user account.
            Args:

            Returns:
                User: Returns user object containing user details
        """
        
        conn = self.get_connection()
        cursor = conn.cursor()

        #Hash the plain text password with a random salt
        PasswordHash = self.hash_password(PlainTextPassword)

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
        UserID = cursor.lastrowid

        conn.commit()
        cursor.close() 
        conn.close()

        return self.loadProfile(userid=UserID)
        
    def logIn(self, username: str, password: str):
        """
        Log in an existing user.
            Args:  
                self(Session), username(str), password(str)
            Returns:
                [int, User] int indicates state message and User object if successful
                0 - Incorrect Password, 1 - Success, 2 - User does not exist
        """

        user_profile = None

        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM Users WHERE Username = %s", (username,))
        #conn.commit()
        
        #If user exists load their profile else delete all fetched results and close the connection
        row = cursor.fetchone()
        if(row is None):
            cursor.close()
            conn.close()
            return [2, user_profile]

        if(not self.verify_password(password, row[6])):
            self.logOut()
            cursor.close()
            conn.close()
            return [0, user_profile]
        
        user_profile = self.loadProfile(username=username)

        cursor.close()
        conn.close()

        return [1, user_profile]

    def logOut(self):
        """
            Removes all user related data from the object 
            Args:
                self: class object
        """
        
        #Clear the profile
        self.UserID = None
        self.Username = None
        self.Lastname = None
        self.Firstnames = None
        self.Email = None
        self.UP_ID = None
        self.PasswordHash = None
        self.Role = None
        self.NotificationPreference = None
        self.DateOfCreation = None
        self.CreationMethod = None
        self.PhoneNumber = None
        self.LastLoginDate = None
        self.ProfileImageID = None
    
    def loadProfile(self,username = None, email = None, userid = None):
        """
            Loads the users details to their profile object
            Args: 
                self: Class object
                username(str), email(str), userid(int)
        """
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        
        #Search for a user based on the first non NULL result
        row = None
        row = self.searchByEmail(email, cursor)
        if row is None:
        
            row = self.searchByUsername(username, cursor)
            if row is None:  
                row = self.searchByUserID(userid, cursor)
            
        user_profile = None

        if row is not None:
            user_profile = User()

            user_profile.UserID = int(row['UserID'])
            user_profile.Username = str(row['Username'])
            user_profile.Lastname = str(row['Lastname'])
            user_profile.Firstnames = str(row['Firstnames'])
            user_profile.Email = str(row['Email'])
            user_profile.UP_ID = str(row['UP_ID'])
            user_profile.PasswordHash = str(row['PasswordHash'])
            user_profile.Role = str(row['Role'])
            user_profile.NotificationPreference = int(row['NotificationPreference'])
            user_profile.DateOfCreation = str(row['DateOfCreation'])
            user_profile.CreationMethod = str(row['CreationMethod'])
            user_profile.PhoneNumber = str(row['PhoneNumber'])
            user_profile.LastLoginDate = str(row['LastLoginDate'])
            user_profile.ProfileImageID = str(row['ProfileImageID'])
            

        cursor.close() 
        conn.close()


        return user_profile
    
    def searchByUsername(self,username: str,cursor):
        """
        Searches for a user based on their username
        
        Args: 
            self: class object
            username(str) 
            cursor(MySQLCursorAbstract) : Object for interfacing the MYSQL database
        
        Returns: The first row results as a tuple or a NONE object if no result
        """

        cursor.execute("SELECT * FROM Users WHERE Username = %s", (username,))
        
        return cursor.fetchone()
    
    def searchByEmail(self,email: str,cursor):
        """
        Searches for a user based on their email
        
        Args: 
            self: class object
            email(str) :
            cursor(MySQLCursorAbstract) : Object for interfacing the MYSQL database
        
        Returns: The first row results as a tuple or a NONE object if no result
        """
        cursor.execute("SELECT * FROM Users WHERE Email = %s", (email,))
        
        return cursor.fetchone()
    
    def searchByUserID(self,userID: int, cursor):
        """
        Searches for a user based on their user ID

        Args: 
            self: class object
            userID(int) 
            cursor(MySQLCursorAbstract) : Object for interfacing the MYSQL database
        
        Returns: The first row results as a tuple or a NONE object if no result
        """
        cursor.execute("SELECT * FROM Users WHERE UserID = %s", (userID,))
        
        return cursor.fetchone()

    def hash_password(self,password: str):
        """
        Hash a password with a random salt.
        
        Args:
            self (User): The Class object
            password (str): The plain text password to hash
            
        Returns:
            str: The hashed password as a string
        """
        
        # Convert password to bytes
        password_bytes = password.encode('utf-8')
        
        # Generate a salt and hash the password
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        
        return hashed.decode('utf-8')

    def verify_password(self,password: str, hashed_password: str):
        """
        Verify a password against its hash.
        
        Args:
            self(User): The class object
            password (str): The plain text password to verify
            hashed_password (str): The stored hashed password
            
        Returns:
            bool: True if password matches, False otherwise
        """
        password_bytes = password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        
        return bcrypt.checkpw(password_bytes, hashed_bytes)

