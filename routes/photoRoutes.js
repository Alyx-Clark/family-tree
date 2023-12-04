const express = require('express');
const photoController = require('../controllers/photoController');
const validatePhoto = require('../middleware/validatePhoto');
const router = express.Router();

router.post('/photo', validatePhoto, photoController.addPhoto);
router.get('/photo/:personId', photoController.getPhotosByPersonId);
router.put('/photo/:id', validatePhoto, photoController.updatePhoto);
router.delete('/photo/:id', photoController.deletePhoto);

module.exports = router;
