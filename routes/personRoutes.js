const express = require('express');
const personController = require('../controllers/personController');
const validatePerson = require('../middleware/validatePerson');
const router = express.Router();

router.post('/person', validatePerson, personController.createPerson);
router.get('/person/:id', personController.getPersonById);
router.put('/person/:id', validatePerson, personController.updatePerson);
router.delete('/person/:id', personController.deletePerson);

module.exports = router;
