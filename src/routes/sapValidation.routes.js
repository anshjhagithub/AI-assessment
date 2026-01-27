import express from 'express';
import { runValidation, fetchValidationReport } from '../controllers/sapValidation.controller.js';
import { validateRequest } from '../middleware/validator.js';
import { validationRequestSchema } from '../schemas/validation.schema.js';

const router = express.Router();

router.post('/run', validateRequest(validationRequestSchema), runValidation);
router.get('/:runId/report', fetchValidationReport);

export default router;


