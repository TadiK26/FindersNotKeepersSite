import os
import psycopg2

def init_database():
    # Read SQL file
    with open('init.sql', 'r') as f:
        sql_script = f.read()
    
    # Connect to database
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cur = conn.cursor()
    
    try:
        # Execute script
        cur.execute(sql_script)
        conn.commit()
        print("Database initialized successfully!")
    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    init_database()
