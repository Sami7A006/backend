import express from 'express';
import { getAllDietitians, getDietitian, updateDietitianProfile, getDietitianDashboard, getAvailableSlots } from '../controllers/dietitianController.js';
import { authenticate, requireDietitian } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllDietitians);
router.get('/:id', getDietitian);
router.get('/:id/available-slots', getAvailableSlots);

router.use(authenticate);
router.put('/profile', requireDietitian, updateDietitianProfile);
router.get('/dashboard/me', requireDietitian, getDietitianDashboard);

export default router;

