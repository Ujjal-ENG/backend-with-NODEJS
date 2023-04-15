/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/extensions */
/* eslint-disable import/prefer-default-export */
import mongoose from 'mongoose';

import bcrypt from 'bcrypt';
import UserSchema from '../model/userModel.js';

const User = mongoose.model('User', UserSchema);

export const userSignUpInfo = async (req, res) => {
    try {
        const hashPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = await User.create({
            name: req.body.name,
            username: req.body.username,
            email: req.body.email,
            password: hashPassword,
        });
        res.status(201).json({
            success: 'User Register Successfully',
            data: newUser,
        });
    } catch (error) {
        res.status(505).json({
            success: 'failed',
            message: error,
        });
    }
};
