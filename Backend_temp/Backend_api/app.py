import os
from datetime import timedelta
from flask import Flask
from extensions import db, jwt
from blueprints import register_blueprints
from flask_session import Session

# Import all models
from models import userModel, Listings, Claims, MessageThread, Message, SessionLog, AuditLog, Report

def create_app():
    app = Flask(__name__)

    # SQLAlchemy config for MySQL
    app.config['SQLALCHEMY_DATABASE_URI'] = "mysql+pymysql://nolwazi_dev:Nolwazi2002@localhost/findersnotkeepers_test"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Flask session config
    app.secret_key = "your_secret_key_here"
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['SESSION_PERMANENT'] = False

    # JWT config
    app.config['JWT_SECRET_KEY'] = os.environ.get("JWT_SECRET_KEY", "dev_jwt_secret")
    app.config['SECRET_KEY'] = os.environ.get("SECRET_KEY", app.config['JWT_SECRET_KEY'])
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=5)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    Session(app)

    # Register blueprints
    register_blueprints(app)

    # Create tables
    with app.app_context():
        print("Creating tables...")
        db.create_all()
        print("Tables should now exist in MySQL!")

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
