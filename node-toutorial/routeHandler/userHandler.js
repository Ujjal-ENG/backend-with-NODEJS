/* eslint-disable import/extensions */
import Express from 'express';
import { userLogin, userSignUpInfo } from '../controllers/userControllers.js';

const router = Express.Router();

// singup handler
router.post('/signup', userSignUpInfo);

// login handler
router.post('/login', userLogin);

export default router;
