import express from 'express';
import spouseController from '../controllers/spouseController.js';
import validateSpouse from '../middleware/validateSpouse.js';

const router = express.Router();

router.post('/spouse', validateSpouse, spouseController.addSpouse);
router.get('/spouse/:spouseId', spouseController.getSpouseById);
router.put('/spouse/:husbandId/:wifeId', validateSpouse, spouseController.updateSpouse);
router.delete('/spouse/:husbandId/:wifeId', spouseController.deleteSpouse);

export default router;
