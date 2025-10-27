from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
import pymysql

# Use PyMySQL as MySQLdb replacement
pymysql.install_as_MySQLdb()

# SQLAlchemy database URI using PyMySQL
SQLALCHEMY_DATABASE_URI = "mysql+pymysql://username:password@localhost/db_name"

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()
revoke_token = set()  # in-memory blacklist for JWT tokens

# No need for flask_mysqldb anymore
# mysql = MySQL()  # REMOVE THIS LINE
