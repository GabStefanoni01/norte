const { Router } = require('express');
const controller = require('./plans.controller');
const authGuard = require('../../middlewares/authGuard');

const router = Router();

router.get('/:userId', authGuard, controller.get);
router.post('/', authGuard, controller.create);
router.patch('/:id/progress', authGuard, controller.updateProgress);

module.exports = router;
