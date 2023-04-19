import express from "express";
import { createUser, getAllUsers,findUserById } from "../controllers/usersControllers.js";

const router = express.Router()

router.get("/", getAllUsers)
router.post("/", createUser)
router.get("/:id", findUserById)


export default router