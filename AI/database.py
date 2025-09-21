import mysql.connector
from mysql.connector import Error
import pandas as pd


def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='findersnotkeepers',
            user='root',
            password='password'  # CHANGE THIS! to actual password
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None


def get_active_listings(listing_type=None):
    connection = get_db_connection()
    if connection is None:
        return pd.DataFrame()

    try:
        query = "SELECT * FROM itemlistings WHERE status = 'active'"
        if listing_type:
            query += f" AND type = '{listing_type}'"

        df = pd.read_sql(query, connection)
        return df
    except Error as e:
        print(f"Error fetching listings: {e}")
        return pd.DataFrame()
    finally:
        if connection.is_connected():
            connection.close()