from extensions import db
from datetime import datetime

class userModel(db.Model):
    __tablename__ = "users_table"
    userID=db.Column(db.Integer,primary_key=True)  # Unique identifier
    username=db.Column(db.String(14),unique=True,nullable=False)
    password=db.Column(db.String(200),nullable=False)  # Store hashed passwords
    role=db.Column(db.String(10),nullable=False,default='user')
    is_active=db.Column(db.Boolean,default=True)
    #For later
    #date = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    #event = db.Column(db.String(200), nullable=False)

#AuditLog to keep track of user actions
class AuditLog(db.Model):
    __tablename__ = "AuditLog"
    logID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    userID = db.Column(db.Integer, nullable=False)
    action = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    details = db.Column(db.Text)

#Report for details
class Report(db.Model):
    __tablename__ = "ReportLog"
    reportID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    reportType = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    dateGenerated = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)