# backend/app.py
from flask import Flask
from flask_cors import CORS
import os

app = Flask(__name__)

# Allow frontend to make requests
CORS(app, origins=[
    "https://findersnotkeepers.onrender.com",  # Production
    "http://localhost:5173"  # Development
])

# Your routes here
@app.route('/api/test')
def test():
    return {"message": "Backend is working!"}

if __name__ == '__main__':
    app.run()
