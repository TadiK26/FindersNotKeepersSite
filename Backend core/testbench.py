from User import User
from datetime import date

def UserTest_1():
    new_user = User()

    new_user.register(Username="Midas", 
                      Lastname="Milly", 
                      Firstnames="Milchick",
                      Email="AU_Midas@proton.com", 
                      UP_ID="NULL", 
                      PlainTextPassword="GoldenTouch", 
                      CreationMethod="Site Registration", 
                      PhoneNumber="NULL", 
                      ProfileImageID=1)
    
    print("New User ID:", new_user.UserID)

def UserTest_2():
    new_user = User()
    password = "ComplPass!26$"
    hashed = new_user.hash_password(password)

    print(hashed)

    pass_check = new_user.verify_password(password, hashed)
    print(pass_check)

    pass_fail = new_user.verify_password("NonPassword", hashed)

    print(pass_fail)

def UserTest_3():
    user_1 = User()
    user_1.loadProfile(email="Lenn123@proton.com")

    user_2 = User()
    user_2.loadProfile(userid=1)

    user_3 = User()
    user_3.loadProfile(username="Midas")





##########Tests##########
#UserTest_1()
#UserTest_2()
#UserTest_3()
