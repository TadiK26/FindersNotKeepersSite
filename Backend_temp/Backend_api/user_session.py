from flask import session, request
from models import SessionLog
from extensions import db
import uuid
from datetime import datetime

def start_user_session(user):
    """
    Store logged-in user information in the Flask session and database.
    """
    session_id = str(uuid.uuid4())
    session['session_id'] = session_id
    session['user_id'] = user.userID
    session['username'] = user.username
    session['role'] = user.role
    session['logged_in'] = True

    # Store session in DB
    new_session = SessionLog(
        sessionID=session_id,
        userID=user.userID,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent'),
        login_time=datetime.utcnow()
    )
    db.session.add(new_session)
    db.session.commit()


def clear_user_session():
    """
    Clear Flask session and mark logout in DB.
    """
    session_id = session.get('session_id')
    if session_id:
        s = SessionLog.query.get(session_id)
        if s:
            s.logout_time = datetime.utcnow()
            db.session.commit()

    # Clear Flask session
    for key in ['session_id', 'user_id', 'username', 'role', 'logged_in']:
        session.pop(key, None)


def get_current_user_id():
    """
    Retrieve the current user's ID from the session.
    Returns None if no session exists.
    """
    return session.get('user_id')
