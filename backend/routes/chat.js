import express from 'express';
import { getChatHistory, sendMessage, createRoom } from '../controllers/chatController.js';

const router = express.Router();

router.post('/room', createRoom);
router.get('/:roomId', getChatHistory);
router.post('/send', sendMessage);

export default router;

