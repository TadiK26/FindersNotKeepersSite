from User import User
from datetime import date

# Create new user
new_user = User(
    Username="jdoe",
    Lastname="Doe",
    Firstnames="John",
    Email="jdoe@example.com",
    PasswordHash="hashed_password",
    Role="User",
    NotificationPreference=1,
    CreationMethod="Self-Register",
    LastLoginDate = date.today()
)
new_user.save()
print("New User ID:", new_user.UserID)

# Fetch user by ID
#user = User.get_by_id(new_user.UserID)
#print(user)

# Update user
#user.LastLoginDate = date.today()
#user.save()
