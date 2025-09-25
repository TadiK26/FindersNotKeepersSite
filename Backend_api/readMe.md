This is the first part of backend, it provides secure RESTful endpoints and handles user authentication and authorization.

These values are used to handle the error accordingly(source: greeksforgreeks)

400 - For Bad Request
401 - For Unauthenticated
403 - For Forbidden request
404 - For Not Found
406 - For Not acceptable
425 - For Unsupported Media
429 - Too many Requests

Dependencies
- Flask
- Flask-JWT-Extended (for authentication)
- SQLAlchemy (for database)

Files

app.py
#To understand how it works(https://www.geeksforgeeks.org/python/python-introduction-to-web-development-using-flask/)
-This file only creates the app
-Sets setup authentication






