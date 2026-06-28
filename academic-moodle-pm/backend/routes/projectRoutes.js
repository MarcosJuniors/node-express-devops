const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/advisors', projectController.getAdvisors);
router.get('/:id/members', projectController.getProjectMembers);
router.post('/add-member', projectController.addMember);
router.post('/add-advisor', projectController.addAdvisor);

module.exports = router;
