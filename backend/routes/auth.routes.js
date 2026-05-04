const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/login', authController.login);
router.get('/perfil', authMiddleware, authController.perfil);

module.exports = router;
