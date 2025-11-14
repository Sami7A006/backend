import express from 'express';
import multer from 'multer';
import { scanIngredients } from '../controllers/scannerController.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

router.post('/scan', upload.single('image'), scanIngredients);

export default router;

