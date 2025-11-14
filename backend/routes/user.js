import express from 'express';
import { updateHealthProfile, addProgress, getDashboard, saveFood } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.put('/health-profile', updateHealthProfile);
router.post('/progress', addProgress);
router.get('/dashboard', getDashboard);
router.post('/save-food', saveFood);

export default router;

