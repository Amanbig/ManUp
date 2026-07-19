import express from "express";
import { register, login, getCurrentUser, updateCurrentUser, deleteCurrentUser } from "../controllers/auth.js";
import { createApiKey, listApiKeys, deleteApiKey } from "../controllers/apiKeys.js";
import { authenticate } from "../middlewares/auth.js";

const user_router = express.Router();

// Public auth routes
user_router.post("/register", register);
user_router.post("/login", login);
user_router.get("/me", authenticate, getCurrentUser);
user_router.put("/me", authenticate, updateCurrentUser);
user_router.delete("/me", authenticate, deleteCurrentUser);

// Protected API key management routes
user_router.post("/api-keys", authenticate, createApiKey);
user_router.get("/api-keys", authenticate, listApiKeys);
user_router.delete("/api-keys/:id", authenticate, deleteApiKey);

export default user_router;