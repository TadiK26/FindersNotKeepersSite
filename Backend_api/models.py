from extensions import db

class User(db.Model):
    user_id=db.Column(db.Integer,primary_key=True)  # Unique identifier
    username=db.Column(db.String(14),unique=True,nullable=False)
    password=db.Column(db.String(200),nullable=False)  # Store hashed passwords
    role=db.Column(db.String(10),nullable=False,default='user')
    is_active=db.Column(db.Boolean,default=True)
    #For later
    #date = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    #event = db.Column(db.String(200), nullable=False)

