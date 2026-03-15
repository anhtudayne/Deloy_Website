import { Router } from 'express';
import { getStats, getHealth, getActivities, getAlerts } from '../controllers/dashboard.controller';
import { authorizeWarehouseAccess } from '../middlewares/dashboard.proxy';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.use(authorizeWarehouseAccess);

router.get('/stats', getStats);
router.get('/health', getHealth);
router.get('/activities', getActivities);
router.get('/alerts', getAlerts);

export default router;
