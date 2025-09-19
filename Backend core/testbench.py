from User import User
from datetime import date

# Create new user


# Fetch user by ID
#user = User.get_by_id(new_user.UserID)
#print(user)

# Update user
#user.LastLoginDate = date.today()
#user.save()

#Test inserting a user into the database tables
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



#UserTest_1()

user_1 = User()
user_1.loadProfile(email="Lenn123@proton.com")

user_2 = User()
user_2.loadProfile(userid=1)

user_3 = User()
user_3.loadProfile(username="Midas")