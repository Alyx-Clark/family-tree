const express = require('express');
const parentChildController = require('../controllers/parentChildController');
const validateParentChild = require('../middleware/validateParentChild');
const router = express.Router();

router.post('/parentChild', validateParentChild, parentChildController.addParentChildRelation);
router.get('/parentChild/:parentId', parentChildController.getChildrenByParentId);
router.delete('/parentChild', parentChildController.removeParentChildRelation);

module.exports = router;
