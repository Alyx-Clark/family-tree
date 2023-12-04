const express = require('express');
const spouseController = require('../controllers/spouseController');
const validateSpouse = require('../middleware/validateSpouse');
const router = express.Router();

router.post('/spouse', validateSpouse, spouseController.addSpouseRelation);
router.get('/spouse/:spouseId', spouseController.getSpouseDetails);
router.put('/spouse/:husbandId/:wifeId', validateSpouse, spouseController.updateSpouseRelation);
router.delete('/spouse/:husbandId/:wifeId', spouseController.removeSpouseRelation);

module.exports = router;
