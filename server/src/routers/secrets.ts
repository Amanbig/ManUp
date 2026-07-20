import express from 'express';
import { getSecrets, setSecret, updateSecret, deleteSecret } from '../controllers/secrets.js';
import { authenticate } from '../middlewares/auth.js';

const secrets_router = express.Router();

secrets_router.get('/:environmentId', authenticate, getSecrets);
secrets_router.post('/', authenticate, setSecret);
secrets_router.put('/:id', authenticate, updateSecret);
secrets_router.delete('/:id', authenticate, deleteSecret);

export default secrets_router;
