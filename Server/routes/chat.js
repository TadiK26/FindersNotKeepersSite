/**
 * This code makes a router that provides API endpoints for managing chat functionality. 
 * There are routes to fetch chat history for a room, get a user's recent chat rooms, and delete chat messages with proper authentication and authorization.
 */

const express = require('express');
const Chat = require('../models/Chat');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get chat history for a room
router.get('/room/:roomId', auth, async (req, res) => { // authenticate user first
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const messages = await Chat.findByRoomId(roomId, limit); // get room by ID
    res.json({ 
      success: true, 
      messages,
      roomId 
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({  // response with status 500
      success: false, 
      error: 'Server error fetching chat history' 
    });
  }
});

// Get user's recent chat rooms
router.get('/my-rooms', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20; // max 20 rooms
    const rooms = await Chat.findUserRooms(req.user.id, limit);
    
    res.json({ // response successful
      success: true, 
      rooms 
    });
  } catch (error) {
    console.error('Get user rooms error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error fetching chat rooms' 
    });
  }
});

// Delete message (user only)
router.delete('/message/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    // need to first check if the message belongs to the user
    const message = await Chat.findById(messageId); 
    if (!message) {
      return res.status(404).json({ 
        success: false, 
        error: 'Message not found' 
      });
    }

    if (message.user_id !== req.user.id) {
      return res.status(403).json({ // return response with status 403
        success: false, 
        error: 'You can only delete your own messages' 
      });
    }

    const deletedMessage = await Chat.deleteMessage(messageId);
    res.json({ // response successful
      success: true, 
      message: 'Message deleted successfully',
      deletedMessage 
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ // response with status 500 error
      success: false, 
      error: 'Server error deleting message' 
    });
  }
});

module.exports = router;