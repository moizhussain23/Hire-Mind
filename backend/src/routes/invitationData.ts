import { Router } from 'express';
import { getInvitationData } from '../controllers/invitationData';

const router = Router();

// Get invitation data by token (used by interview page)
router.post('/data', getInvitationData);

export default router;