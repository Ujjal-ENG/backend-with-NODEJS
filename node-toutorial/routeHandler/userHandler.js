/* eslint-disable import/extensions */
import Express from 'express';
import { userSignUpInfo } from '../controllers/userControllers.js';

const router = Express.Router();

// singup handler
router.post('/signup', userSignUpInfo);

export default router;
