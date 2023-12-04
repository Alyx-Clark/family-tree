import express from 'express';
import photoController from '../controllers/photoController.js';
import validatePhoto from '../middleware/validatePhoto.js';

const router = express.Router();

router.post('/photo', validatePhoto, photoController.addPhoto);
router.get('/photo/:personId', photoController.getPhotosByPersonId);
router.put('/photo/:id', validatePhoto, photoController.updatePhoto);
router.delete('/photo/:id', photoController.deletePhoto);

export default router;
