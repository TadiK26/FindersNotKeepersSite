import os
from datetime import timedelta
from flask import Flask
from extensions import db, jwt
from blueprints import register_blueprints

def create_app():
    app = Flask(__name__)   #Flask constructor, creating app

    #Configure the Flask App and its database
    app.config['SQLALCHEMY_DATABASE_URI']=os.environ.get("DATABASE_URL",'sqlite:///users_table.db') #specify table location
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS']=False
    app.config['JWT_SECRET_KEY']=os.environ.get("JWT_SECRET_KEY", "dev_jwt_secret")
    app.config['SECRET_KEY']=os.environ.get("SECRET_KEY",app.config['JWT_SECRET_KEY'])
    app.config["JWT_ACCESS_TOKEN_EXPIRES"]=timedelta(minutes=int(os.environ.get("JWT_ACCESS_MINUTES",5)))
    app.config["JWT_REFRESH_TOKEN_EXPIRES"]=timedelta(days=int(os.environ.get("JWT_REFRESH_DAYS",7)))


    #Initialize the database
    db.init_app(app)
    jwt.init_app(app)


    #Check if userss folder exists
    try:
        os.makedirs(app.instance_path)#create a folder fr the table
    except OSError:
        pass

    #from routes import auth_bp,finder_bp
    # #A decorator to tell the application which URL is associated function
    # @finder_bp.route('/')#Home route
    # #@app.route('/')
    # def home():
    #     return 'Track your lost item with us'

    # app.register_blueprint(finder_bp)
    # app.register_blueprint(auth_bp)
    register_blueprints(app)

    with app.app_context():
        db.create_all()

    return app

#Run app
if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)