#FOr my SQL
myUsername="nolwazi_dev"
password="Nolwazi%402002"
dbhost="localhost"
dbname="findernotkeepers"
SQLALCHEMY_DATABASE_URI=f"mysql+pymysql://{myUsername}:{password}@{dbhost}/{dbname}"
SQLALCHEMY_TRACK_MODIFICATIONS=False