const { Router } = require('express');
const controller = require('./community.controller');
const authGuard = require('../../middlewares/authGuard');
const adminGuard = require('../../middlewares/adminGuard');

const router = Router();

// Leitura pública
router.get('/posts', controller.listPosts);
router.get('/posts/:id', controller.getPost);
router.get('/categories', controller.listCategories);

// Ações de usuário autenticado
router.post('/posts', authGuard, controller.createPost);
router.post('/posts/:id/comments', authGuard, controller.createComment);
router.post('/posts/:id/reactions', authGuard, controller.createReaction);
router.delete('/posts/:id/reactions/:tipo', authGuard, controller.removeReaction);

// Moderador/admin
router.delete('/posts/:id', authGuard, adminGuard, controller.deletePost);

module.exports = router;
