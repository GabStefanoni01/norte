const profileService = require('./profile.service');

async function save(req, res, next) {
  try {
    const profile = await profileService.upsertProfile(req.user.sub, req.body);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const profile = await profileService.getProfile(req.user.sub);
    if (!profile) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

module.exports = { save, get };
