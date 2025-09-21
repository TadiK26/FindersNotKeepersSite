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

    pass_check = new_session.verify_password(password, hashed)

    if(pass_check):
        print("Test 2.1: Passed")
    else:
        print("Test 2.1: Failed")


    pass_fail = new_session.verify_password("NonPassword", hashed)

    if(not pass_fail):
        print("Test 2.2: Passed")
    else:
        print("Test 2.2: Failed")
    
    print("\n")

#Tests that user can log in and log out
def SessionTest_3():
    #BATMAN PASSWORD: "AuraFarmer"
    print("Session Test 3: User Log In and Log Out")

    current_session = Session("Cur_Sesh","187.90.85.204")
    [state, user] = current_session.logIn("Bane","AURAFARMER")

    if(state == 2):
        print("Test 3.1: Passed")
    else:
        print("Test 3.1: Failed")

    [state, user] = current_session.logIn("Batman","AURAFARMER")

    if(state == 0):
        print("Test 3.2: Passed")
    else:
        print("Test 3.2: Failed")

    [state, user] = current_session.logIn("Batman","AuraFarmer")

    if(state == 1):
        if(user.Username == "Batman"):
            print("Test 3.3: Passed")
        else:
            print("Test 3.3: Password correct, wrong user loaded")
    else:
        print("Test 3.3: Failed")

    print("\n")

def SessionTests():
    print("Unit Tests for Session.py: \n")
    SessionTest_1()
    SessionTest_2()
    SessionTest_3()





##########Tests##########

#SessionTests()

#Add tests for log in and log out
