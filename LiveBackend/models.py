from extensions import db
from datetime import datetime

class userModel(db.Model):
    __tablename__ = "users_table"
    userID = db.Column(db.Integer, primary_key=True)  # Unique identifier
    email = db.Column(db.String(120), unique=True, nullable=False)  # New: email instead of username
    password = db.Column(db.String(200), nullable=False)  # Store hashed passwords
    role = db.Column(db.String(10), nullable=False, default='user')
    is_active = db.Column(db.Boolean, default=True)
    avatar = db.Column(db.String(300), nullable=True)


    # For future use
    # date = db.Column(db.DateTime, default=datetime.utcnow)
    # event = db.Column(db.String(200), nullable=False)

# ----------------- Audit Log -----------------
class AuditLog(db.Model):
    __tablename__ = "Auditlog"
    logID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    userID = db.Column(db.Integer, nullable=False)
    action = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    details = db.Column(db.Text)

# ----------------- Reports -----------------
class Report(db.Model):
    __tablename__ = "ReportLog"
    reportID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    reportType = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    dateGenerated = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

# ----------------- Listings -----------------
class Listings(db.Model):
    __tablename__ = "listings"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(300))

    # Relationship to user
    user_id = db.Column(db.Integer, db.ForeignKey('users_table.userID'))
    user = db.relationship('userModel', backref='listings')

    # New fields
    status = db.Column(db.String(20), nullable=False, default="LOST")  # LOST or FOUND
    where = db.Column(db.String(150), nullable=False)
    when = db.Column(db.Date, nullable=False)
    category_id = db.Column(db.Integer, nullable=False)

    contact_name = db.Column(db.String(100), nullable=False)
    contact_email = db.Column(db.String(120), nullable=False)
    contact_phone = db.Column(db.String(20))

    photo = db.Column(db.String(255))  # path to uploaded image

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# ----------------- Claims -----------------
class Claims(db.Model):
    __tablename__ = "claims"
    id = db.Column(db.Integer, primary_key=True)
    listing_id = db.Column(db.Integer, db.ForeignKey('listings.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users_table.userID'), nullable=False)
    message = db.Column(db.String(200))

# ----------------- Messages -----------------
class MessageThread(db.Model):
    __tablename__ = 'messagethread'
    ThreadID = db.Column(db.String(50), primary_key=True)
    Participant1 = db.Column(db.Integer, nullable=False)
    Participant2 = db.Column(db.Integer, nullable=False)
    DateOfCreation = db.Column(db.Date, default=datetime.utcnow)
    messages = db.relationship('Message', backref='thread', lazy=True)

class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    thread_id = db.Column(db.String(50), db.ForeignKey('messagethread.ThreadID'), nullable=False)
    sender_id = db.Column(db.Integer, nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# ----------------- Session Log -----------------
class SessionLog(db.Model):
    __tablename__ = 'sessionlog'
    sessionID = db.Column(db.String(50), primary_key=True)
    userID = db.Column(db.Integer, nullable=False)
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.Text)
    login_time = db.Column(db.DateTime, default=datetime.utcnow)
    logout_time = db.Column(db.DateTime, nullable=True)


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users_table.userID"))
    listing_id = db.Column(db.Integer, db.ForeignKey('listings.id'), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    body = db.Column(db.String(300))
    unread = db.Column(db.Boolean, default=True)
    type = db.Column(db.String(20), default="system")  # system, message
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('userModel', backref='notifications')
