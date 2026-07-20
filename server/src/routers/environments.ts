import express from 'express';
import {
  createEnvironment,
  listEnvironments,
  getEnvironment,
  updateEnvironment,
  deleteEnvironment,
} from '../controllers/environments.js';
import {
  listEnvironmentMembers,
  addEnvironmentMember,
  deleteEnvironmentMember,
} from '../controllers/memberships.js';
import { authenticate } from '../middlewares/auth.js';

const environments_router = express.Router();

environments_router.post('/', authenticate, createEnvironment);
environments_router.get('/detail/:id', authenticate, getEnvironment);
environments_router.get('/:projectId', authenticate, listEnvironments);
environments_router.put('/detail/:id', authenticate, updateEnvironment);
environments_router.delete('/detail/:id', authenticate, deleteEnvironment);
environments_router.get('/detail/:id/members', authenticate, listEnvironmentMembers);
environments_router.post('/detail/:id/members', authenticate, addEnvironmentMember);
environments_router.delete('/detail/:id/members/:userId', authenticate, deleteEnvironmentMember);

export default environments_router;
