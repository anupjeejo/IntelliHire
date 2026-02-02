import express from "express";
import { registerUser } from "../controllers/auth.js";
import uploadFile from "../middleware/multer.js";

const router = express();

router.post("/register", uploadFile, registerUser)

export default router;