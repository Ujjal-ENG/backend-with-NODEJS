/* eslint-disable import/extensions */
/* eslint-disable import/no-extraneous-dependencies */
import express from 'express';
import {
  createTodo,
  deleteTodoById,
  getAllTodos,
  getOneTodobyID,
  updateTodoById,
} from '../controllers/todoControllers.js';

const router = express.Router();

// get all the todos
router.get('/', getAllTodos);

// create the todo
router.post('/', createTodo);

// update the todo
router.patch('/:id', updateTodoById);

// delete the todo
router.delete('/:id', deleteTodoById);

// find the todo using ID

router.get('/:id', getOneTodobyID);

export default router;
