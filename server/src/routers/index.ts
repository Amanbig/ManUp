import express from 'express';
import user_router from './users.js';
import secrets_router from './secrets.js';

const router = express.Router()

router.use("/users", user_router)
router.use("/secrets", secrets_router)

export default router;