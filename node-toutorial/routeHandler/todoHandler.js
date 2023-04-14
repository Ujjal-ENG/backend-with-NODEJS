/* eslint-disable import/extensions */
/* eslint-disable import/no-extraneous-dependencies */
import express from 'express';
import { createTodo, getAllTodos } from '../controllers/todoControllers.js';

const router = express.Router();

// get all the todos
router.get('/', getAllTodos);

// create the todo
router.post('/', createTodo);

// update the todo
router.patch('/:id', (req, res) => {});

// delete the todo
router.delete('/:id', (req, res) => {});

// find the todo using ID

router.get('/:id', (req, res) => {});
export default router;
