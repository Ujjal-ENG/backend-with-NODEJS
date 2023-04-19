import express from "express";
import { createUser, getAllUsers } from "../controllers/usersControllers.js";

const router = express.Router()

router.get("/", getAllUsers)
router.post("/", createUser)


export default router