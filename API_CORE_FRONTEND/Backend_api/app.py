# app.py
from flask import Flask, send_from_directory
from blueprints import register_blueprints
from extensions import db, jwt
import os
from datetime import timedelta
from flask_cors import CORS
from flask_session import Session

# Import models
from models import userModel, Listings, Claims, MessageThread, Message, SessionLog, AuditLog, Report

# Import UPLOAD_FOLDER from auth_routes
from routes.auth_routes import UPLOAD_FOLDER  

def create_app():
    app = Flask(__name__)

    # Configs...
    app.config['SQLALCHEMY_DATABASE_URI'] = "mysql+pymysql://nolwazi_dev:Nolwazi2002@localhost/findersnotkeepers_test"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.secret_key = "your_secret_key_here"
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['SESSION_PERMANENT'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get("JWT_SECRET_KEY", "dev_jwt_secret")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=30)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)

    # Initialize extensions
    CORS(app)
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

    # ------------------- Serve uploaded files -------------------
    # Assuming your uploads folder is at the root of your backend project
    @app.route('/uploads/<filename>')
    def uploaded_file(filename):
        return send_from_directory('uploads', filename)
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
