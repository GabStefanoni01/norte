const { Router } = require('express');
const controller = require('./users.controller');
const authGuard = require('../../middlewares/authGuard');

const router = Router();

router.use(authGuard);
router.get('/:id', controller.getById);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
