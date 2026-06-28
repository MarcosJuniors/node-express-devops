const express = require('express');
const router = express.Router();
const evolutionController = require('../controllers/evolutionController');

router.get('/students', evolutionController.getStudentList);
router.get('/:studentId/xp-log', evolutionController.getStudentEvolution);
router.post('/read-book', evolutionController.readLibraryBook);

module.exports = router;
