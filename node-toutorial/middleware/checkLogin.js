/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/prefer-default-export */
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

export const checkLogin = (req, res, next) => {
    const { authorization } = req.headers;
    try {
        const token = authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { username, userId } = decoded;

        req.username = username;
        req.userId = userId;
        next();
    } catch (error) {
        next('Authenitication Failed');
    }
};
