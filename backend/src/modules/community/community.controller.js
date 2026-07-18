const communityService = require('./community.service');

async function listCategories(req, res, next) {
  try {
    const categorias = await communityService.listCategories();
    res.json(categorias);
  } catch (err) {
    next(err);
  }
}

async function listPosts(req, res, next) {
  try {
    const limit = Number(req.query.limit);
    const posts = await communityService.listPosts({
      categoria: req.query.categoria,
      query: req.query.q,
      limit: Number.isInteger(limit) && limit > 0 ? limit : undefined,
    });
    res.json(posts);
  } catch (err) {
    next(err);
  }
}

async function getPost(req, res, next) {
  try {
    const post = await communityService.getPost(req.params.id);
    if (!post) return res.status(404).json({ error: 'Publicação não encontrada' });
    res.json(post);
  } catch (err) {
    next(err);
  }
}

async function createPost(req, res, next) {
  try {
    const post = await communityService.createPost(req.user.sub, req.body, req.user.role);
    res.status(201).json(post);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
}

async function createComment(req, res, next) {
  try {
    const comment = await communityService.createComment(req.user.sub, req.params.id, req.body);
    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function createReaction(req, res, next) {
  try {
    const reaction = await communityService.createReaction(req.user.sub, req.params.id, req.body.tipo);
    res.status(201).json(reaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function removeReaction(req, res, next) {
  try {
    const reaction = await communityService.removeReaction(req.user.sub, req.params.id, req.params.tipo);
    res.json(reaction);
  } catch (err) {
    next(err);
  }
}

async function deletePost(req, res, next) {
  try {
    const post = await communityService.deletePost(req.params.id);
    if (!post) return res.status(404).json({ error: 'Publicação não encontrada' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCategories,
  listPosts,
  getPost,
  createPost,
  createComment,
  createReaction,
  removeReaction,
  deletePost,
};
