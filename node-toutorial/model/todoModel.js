/* eslint-disable import/no-extraneous-dependencies */
import mongoose from 'mongoose';

const TodoSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    status: {
        type: String,
        enum: ['active', 'inactive'],
    },
    date: {
        type: Date,
        default: Date.now(),
    },
});

export default TodoSchema;
