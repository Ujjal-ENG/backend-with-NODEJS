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
export const getAllTodos = async (req, res) => {
    try {
        const allTodos = await Todo.find();
        res.status(200).json({
            success: 'successful',
            results: allTodos.length,
            data: allTodos,
        });
    } catch (error) {
        res.status(500).json({
            success: 'failed',
            msg: error,
        });
    }
};
export const getOneTodobyID = async (req, res) => {
    try {
        const dataId = await Todo.findById(req.params.id);

        res.status(200).json({
            success: 'successful',
            results: dataId.length,
            data: dataId,
        });
    } catch (error) {
        res.status(500).json({
            success: 'failed',
            msg: error,
        });
    }
};
export const updateTodoById = async (req, res) => {
    try {
        const dataId = await Todo.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: 'updated successful',
            results: dataId.length,
            data: dataId,
        });
    } catch (error) {
        res.status(500).json({
            success: 'failed',
            msg: error,
        });
    }
};

export const deleteTodoById = async (req, res) => {
    try {
        const dataId = await Todo.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: 'deleted successful',
            results: dataId.length,
            data: dataId,
        });
    } catch (error) {
        res.status(500).json({
            success: 'failed',
            msg: error,
        });
    }
};
