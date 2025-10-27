# utils/auth.py
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import decode_token, exceptions
from extensions import db
from models import userModel

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Check for token in the request header
        if "Authorization" in request.headers:
            token = request.headers["Authorization"].split(" ")[1]  # "Bearer <token>"

        if not token:
            return jsonify({"message": "Token is missing"}), 401

        try:
            decoded_token = decode_token(token)
            user_email = decoded_token.get("sub")  # 'sub' holds user identifier
            current_user = userModel.query.filter_by(email=user_email).first()

            if not current_user:
                return jsonify({"message": "User not found"}), 404

        except exceptions.ExpiredSignatureError:
            return jsonify({"message": "Token has expired"}), 401
        except Exception as e:
            return jsonify({"message": "Token is invalid", "error": str(e)}), 401

        return f(current_user, *args, **kwargs)

    return decorated
