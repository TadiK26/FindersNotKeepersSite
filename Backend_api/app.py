from flask import Flask
from flask import Blueprint


app = Flask(__name__)   # Flask constructor, creating app
#app_route = Blueprint('finders', __name__, url_prefix='/findersnotkeepers')

#A decorator to tell the application which URL is associated function
#@app_route.route('/')#Home route
@app.route('/')
def home():
    return 'Track your lost item with us'

#app.register_blueprint(app_route)

if __name__=='__main__':
    app.run(debug=True)#Run app