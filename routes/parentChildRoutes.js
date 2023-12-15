import express from 'express';
import parentChildController from '../controllers/parentChildController.js';
import validateParentChild from '../middleware/validateParentChild.js';

const router = express.Router();

router.post('/parentChild', validateParentChild, parentChildController.addParentChildRelation);
router.get('/parentChild/:parentId', parentChildController.getChildrenByParentId);
router.delete('/parentChild', parentChildController.deleteParentChildRelation);

export default router;
