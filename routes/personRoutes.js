import express from 'express';
import personController from '../controllers/personController.js';
import validatePerson from '../middleware/validatePerson.js';

const router = express.Router();

router.post('/person', validatePerson, personController.createPerson);
router.get('/person/:id', personController.getPersonById);
router.put('/person/:id', validatePerson, personController.updatePerson);
router.delete('/person/:id', personController.deletePerson);

export default router;
