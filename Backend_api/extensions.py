from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
SQLALCHEMY_DATABASE_URI = "mysql+pymysql://username:password@localhost/db_name"

db=SQLAlchemy()
jwt=JWTManager()
revoke_token=set()#blacklist tokens in memoryh