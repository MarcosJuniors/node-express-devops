const express = require('express');
const router = express.Router();
const kanbanController = require('../controllers/kanbanController');

router.get('/:projectId', kanbanController.getKanbanTasks);
router.post('/sprint', kanbanController.createSprint);
router.post('/task', kanbanController.createTask);
router.put('/task/:taskId', kanbanController.updateTaskStatus);

module.exports = router;
