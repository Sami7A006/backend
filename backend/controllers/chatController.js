import Chat from '../models/Chat.js';

export const createRoom = async (req, res) => {
  try {
    const { roomName } = req.body;
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({ 
      roomId,
      roomName: roomName || 'Chat Room',
      message: 'Room created successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const messages = await Chat.find({ roomId })
      .sort({ createdAt: 1 })
      .limit(100);
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { roomId, message, type, imageUrl, senderName } = req.body;
    
    if (!roomId || !message) {
      return res.status(400).json({ message: 'Room ID and message are required' });
    }
    
    const chatMessage = await Chat.create({
      roomId,
      sender: senderName || 'Anonymous',
      message,
      type: type || 'text',
      imageUrl
    });
    
    res.status(201).json({ message: 'Message sent', chat: chatMessage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
