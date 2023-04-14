/* eslint-disable import/extensions */
/* eslint-disable import/no-extraneous-dependencies */
import express from 'express';
import Todo from '../model/todoModel.js';

const router = express.Router();

// get all the todos
router.get('/', (req, res) => {});

// create the todo
router.post('/', async (req, res) => {
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
});

// update the todo
router.patch('/:id', (req, res) => {});

// delete the todo
router.delete('/:id', (req, res) => {});

// find the todo using ID

router.get('/:id', (req, res) => {});
export default router;
