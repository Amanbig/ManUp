import express from 'express';
import user_router from './users.js';
import secrets_router from './secrets.js';
import projects_router from './projects.js';
import environments_router from './environments.js';
import organizations_router from './organizations.js';

const router = express.Router();

router.use('/users', user_router);
router.use('/secrets', secrets_router);
router.use('/projects', projects_router);
router.use('/environments', environments_router);
router.use('/organizations', organizations_router);

export default router;
