# Backend_api/sessions.py
from flask import session

def start_user_session(user):
    """
    Store logged-in user information in the session.
    """
    session['user_id'] = user.userID
    session['username'] = user.username
    session['role'] = user.role
    session['logged_in'] = True


def clear_user_session():
    """
    Safely clear all user-related session data.
    """
    session_keys = ['user_id', 'username', 'role', 'logged_in']
    for key in session_keys:
        session.pop(key, None)


def get_current_user_id():
    """
    Retrieve the current user's ID from the session.
    Returns None if no session exists.
    """
    return session.get('user_id')
