import express from 'express';
import { chatWithAI, analyzeIngredient, generateDietPlan } from '../controllers/aiController.js';

const router = express.Router();

router.post('/chat', chatWithAI);
router.post('/analyze-ingredient', analyzeIngredient);
router.post('/generate-diet-plan', generateDietPlan);

export default router;

