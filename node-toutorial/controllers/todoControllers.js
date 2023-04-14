/* eslint-disable import/extensions */
import Todo from '../model/todoModel.js';

/* eslint-disable import/prefer-default-export */
export const createTodo = async (req, res) => {
    try {
        const newTodo = await Todo.create(req.body);
        res.status(201).json({
            success: 'successful',
            msg: 'Data is successfully inserted',
            data: newTodo,
        });
    } catch (error) {
        res.status(500).json({
            success: 'failed',
            msg: error,
        });
    }
};
