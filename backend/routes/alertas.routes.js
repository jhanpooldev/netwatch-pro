const router = require('express').Router();
const ctrl = require('../controllers/alertas.controller');
const auth = require('../middlewares/auth.middleware');

router.use(auth);
router.get('/', ctrl.listar);
router.get('/criticas', ctrl.contarCriticas);
router.put('/:id/reconocer', ctrl.reconocer);

module.exports = router;
