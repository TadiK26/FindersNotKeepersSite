# Backend_api/routes/messages.py
from flask import Blueprint, request, jsonify, session
from log_utils import log_audit

messages_bp = Blueprint("messages", __name__)

# In-memory data store
threads = {}  # threadID -> {"participants": [id1, id2], "messages": [{"sender_id":..., "content":...}]}
thread_counter = 1


@messages_bp.route("/messages", methods=["POST"])
def send_message():
    """
    Send a message from the logged-in user to a receiver.
    Uses Flask session to determine sender.
    """
    if not session.get('logged_in'):
        return jsonify({"error": "You must be logged in to send messages"}), 401

    global thread_counter

    sender_id = session['user_id']  # get from session automatically
    data = request.json
    receiver_id = data.get("receiver_id")
    content = data.get("content")
    threadID = data.get("threadID")  # optional existing thread

    if not receiver_id or not content:
        return jsonify({"error": "receiver_id and content are required"}), 400

    # Step 1: Find or create thread
    if not threadID:
        for tid, thread in threads.items():
            if set(thread["participants"]) == set([sender_id, receiver_id]):
                threadID = tid
                break
        if not threadID:
            threadID = f"thread{thread_counter}"
            threads[threadID] = {"participants": [sender_id, receiver_id], "messages": []}
            thread_counter += 1

    # Step 2: Add message
    threads[threadID]["messages"].append({
        "sender_id": sender_id,
        "content": content
    })

    log_audit(
        userID=sender_id,
        action="SEND_MESSAGE",
        details=f"Sent to user {receiver_id} in thread {threadID}: {content[:50]}"
    )

    return jsonify({
        "message": "Message sent successfully",
        "threadID": threadID,
        "messages": threads[threadID]["messages"]
    })


@messages_bp.route("/messages/<threadID>", methods=["GET"])
def get_messages(threadID):
    """
    Retrieve all messages from a thread for logged-in user.
    """
    if not session.get('logged_in'):
        return jsonify({"error": "You must be logged in to view messages"}), 401

    if threadID not in threads:
        return jsonify({"error": "Thread not found"}), 404

    # Only allow viewing if user is in participants
    if session['user_id'] not in threads[threadID]["participants"]:
        return jsonify({"error": "You are not a participant in this thread"}), 403

    return jsonify({
        "threadID": threadID,
        "participants": threads[threadID]["participants"],
        "messages": threads[threadID]["messages"]
    })
