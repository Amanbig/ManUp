import express from 'express';
import {
  getCurrentOrganization,
  updateCurrentOrganization,
  deleteCurrentOrganization,
  createOrganization,
  listOrganizationMembers,
  addOrganizationMember,
} from '../controllers/organizations.js';
import { authenticate } from '../middlewares/auth.js';

const organizations_router = express.Router();

organizations_router.post('/', authenticate, createOrganization);
organizations_router.get('/current', authenticate, getCurrentOrganization);
organizations_router.put('/current', authenticate, updateCurrentOrganization);
organizations_router.delete('/current', authenticate, deleteCurrentOrganization);
organizations_router.get('/members', authenticate, listOrganizationMembers);
organizations_router.post('/members', authenticate, addOrganizationMember);

export default organizations_router;
