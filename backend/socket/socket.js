import Chat from '../models/Chat.js';

export const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join chat room
    socket.on('join-room', async (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Handle chat messages
    socket.on('send-message', async (data) => {
      try {
        const { roomId, senderName, message, type, imageUrl } = data;
        
        const chatMessage = await Chat.create({
          roomId,
          sender: senderName,
          message,
          type: type || 'text',
          imageUrl
        });
        
        // Emit to all clients in the room
        io.to(roomId).emit('receive-message', chatMessage);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });


    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

