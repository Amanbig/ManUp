import express from 'express';
import { getAuditLogs } from '../controllers/auditLogs.js';
import { authenticate } from '../middlewares/auth.js';

const audit_logs_router = express.Router();

audit_logs_router.get('/', authenticate, getAuditLogs);

export default audit_logs_router;
