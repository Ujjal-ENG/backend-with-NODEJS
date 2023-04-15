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
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
    },
});

// static methids

TodoSchema.statics = {
    findByActive() {
        return this.find({ status: 'active' });
    },
};
// query helpers
TodoSchema.query = {
    findbyLang(language) {
        return this.find({ title: new RegExp(language, 'i') });
    },
};
export default TodoSchema;
