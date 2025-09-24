from User import User
from Session import Session
from datetime import date
import mysql.connector

#Tests that a user can register
def SessionTest_1():
    print("Session Test 1: User Registration")
    new_session = Session("TEST_SESH","192.168.4.1")

    new_user = new_session.register(Username="Hulk", 
                      Lastname="Banner", 
                      Firstnames="Bruce",
                      Email="smash@proton.com", 
                      UP_ID="NULL", 
                      PlainTextPassword="BulkyScientist", 
                      CreationMethod="Site Registration", 
                      PhoneNumber="NULL", 
                      ProfileImageID=1)
    
    if(new_user is not None):
        print("Test Passed\nNew User ID:", new_user.UserID)

        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="tadiwanashe",
            database="findersnotkeepers"
        )
    
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Users WHERE UserID = %s", (new_user.UserID,))

        conn.commit()
        cursor.close() 
        conn.close()
    else:
        print("Test Failed")

    print("\n")

#Tests that password encryption works
def SessionTest_2():
    print("Session Test 2: Password Encryption")

    new_session = Session("TEST_SESH","192.168.4.1")
    password = "ComplPass!26$"
    hashed = new_session.hash_password(password)

    print(hashed)

    pass_check = new_session.verify_password(password, hashed)

    if(pass_check):
        print("Test 2.1 - Encrypting and Accept New Password: Passed")
    else:
        print("Test 2.1 - Encrypting and Accept New Password: Failed")


    pass_fail = new_session.verify_password("NonPassword", hashed)

    if(not pass_fail):
        print("Test 2.2 - Reject Wrong Password: Passed")
    else:
        print("Test 2.2 - Reject Wrong Password: Failed")
    
    print("\n")

#Tests that user can log in and log out
def SessionTest_3():
    #BATMAN PASSWORD: "AuraFarmer"
    print("Session Test 3: User Log In and Log Out")

    current_session = Session("Cur_Sesh","187.90.85.204")
    [state, user] = current_session.logIn("Bane","AURAFARMER")

    if(state == 2):
        print("Test 3.1 - Deny User that doesn't exist: Passed")
    else:
        print("Test 3.1 - Deny User that doesn't exist: Failed")

    [state, user] = current_session.logIn("Batman","AURAFARMER")

    if(state == 0):
        print("Test 3.2 - Reject Wrong Password: Passed")
    else:
        print("Test 3.2 - Reject Wrong Password: Failed")

    [state, user] = current_session.logIn("Batman","AuraFarmer")

    if(state == 1):
        if(user.Username == "Batman"):
            print("Test 3.3 - Accept Correct Password: Passed")
        else:
            print("Test 3.3: Password correct, wrong user loaded")
    else:
        print("Test 3.3: Failed")

    print("\n")

def SessionTests():
    print("Unit Tests for Session.py: \n------------------------")
    #SessionTest_1()
    SessionTest_2()
    #SessionTest_3()

#User can update their profile
def UserTest_1():
    print("User Test 1: Update Profile")

    current_session = Session("Cur_Sesh","187.90.85.204")
    [state, user] = current_session.logIn("Batman","AuraFarmer")

    if(state == 1):
        if(user.Username == "Batman"):
            newEmail = "darkknight14@proton.com"
            user.Email = newEmail

            res = user.UpdateProfile()

            if(res):
                user = current_session.loadProfile(userid=user.UserID)

                if(user.Email == newEmail):
                    print("Test 1 - Email Change: Passed")
                else:
                    print("Test 1 - Email Change: Failed - No Value Change")

            else:
                print("Test 1: Failed - Update Error")

    else:
        print("Test 1: Failed - Couldn't log in")

    print("\n")

def UserTest_2():
    print("User Test 2: Creating a new listing")

    current_session = Session("Cur_Sesh","187.90.85.204")
    [state, user] = current_session.logIn("Batman","AuraFarmer")

    if(state == 1):
        if(user.Username == "Batman"):
            
            res = user.MakeListing("Cowl", 3, "Hides Identity", "Engineerng 2", False, 1)
            
            conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="tadiwanashe",
            database="findersnotkeepers"
            )
        
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM Listings ORDER BY ListingID DESC LIMIT 1")

            

            if(res == 1):
                print("Test 2: Passed")
                print(cursor.fetchone())
            else:
                print("Failed")

            cursor.close() 
            conn.close()

    else:
        print("Test 2: Failed - Couldn't log in")

    print("\n")

def UserTest_3():
    print("User Test 3: Contact a user")

    current_session = Session("Cur_Sesh","187.90.85.204")
    [state, user] = current_session.logIn("Batman","AuraFarmer")

    res = user.ContactUser(10008)

    if(res is None):
        print("User Test 3.1 - Contact User that doesn't exist: Passed")
    else:
        print("User Test 3.1 - Contact User that doesn't exist : Failed")

    res,id = user.ContactUser(10009)

    if(id > 0):
        print("User Test 3.2 - Contact User that does exist: Passed")
    else:
        print("User Test 3.2 - Contact User that does exist: Failed")

    print("\n")



def UserTests():
    print("Unit Tests for User.py: \n-----------------------------------")
    UserTest_1()
    UserTest_2()
    UserTest_3()



##########Tests##########

SessionTests()
#UserTests()