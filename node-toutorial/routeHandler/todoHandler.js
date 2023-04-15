/* eslint-disable prettier/prettier */
/* eslint-disable import/extensions */
/* eslint-disable import/no-extraneous-dependencies */
import express from 'express';
import {
  createTodo,
  deleteTodoById,
  findByDataLang,
  findByStatusData,
  getAllTodos,
  getOneTodobyID,
  updateTodoById,
} from '../controllers/todoControllers.js';
import { checkLogin } from '../middleware/checkLogin.js';

const router = express.Router();

// get all the todos
router.get('/', checkLogin, getAllTodos);

// create the todo
router.post('/', checkLogin, createTodo);

// update the todo
router.patch('/:id', updateTodoById);

// delete the todo
router.delete('/:id', deleteTodoById);

// find the todo using ID

router.get('/:id', getOneTodobyID);

// find the active data
router.get('/todos/active', findByStatusData);

// find by data using by languages
router.get('/todos/language', findByDataLang);

export default router;
