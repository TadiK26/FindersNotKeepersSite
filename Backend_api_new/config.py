#FOr my SQL
# # password = "my@pass123"
# # encoded_password = quote_plus(password)
# myUsername="nolwazi_dev"
# password="Nolwazi2002"
# dbhost="localhost"
# dbname="findernotkeepers_test"
# SQLALCHEMY_DATABASE_URI=f"mysql+pymysql://{myUsername}:{password}@{dbhost}/{dbname}"
# SQLALCHEMY_TRACK_MODIFICATIONS=False

#For pgAdmin
myUsername = "nolwazi_dev"
password = "Nolwazi2002"
dbhost = "localhost"
dbname = "findernotkeepers_test"

SQLALCHEMY_DATABASE_URI = f"postgresql+psycopg2://{myUsername}:{password}@{dbhost}/{dbname}"
SQLALCHEMY_TRACK_MODIFICATIONS = False
