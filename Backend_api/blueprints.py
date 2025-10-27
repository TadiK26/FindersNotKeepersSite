from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.admin_routes import admin_bp

def register_blueprints(app):
    app.register_blueprint(auth_bp)#Blueprint for app in authentication routes
    app.register_blueprint(user_bp)#Users blueprint for all users icnluding adminn and owner
    app.register_blueprint(admin_bp)#Blueprint for admin routes only
