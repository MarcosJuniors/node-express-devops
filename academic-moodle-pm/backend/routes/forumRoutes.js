const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');

router.get('/', forumController.getTopics);
router.get('/:topicId', forumController.getTopicDetails);
router.post('/', forumController.createTopic);
router.post('/reply', forumController.createReply);

module.exports = router;
