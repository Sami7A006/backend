import express from 'express';
import { generateMealPlan, generateGroceryList, saveMealPlan } from '../controllers/mealController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/generate-plan', generateMealPlan);
router.post('/grocery-list', generateGroceryList);
router.post('/save-plan', saveMealPlan);

export default router;

