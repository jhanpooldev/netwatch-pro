const router = require('express').Router();
const ctrl = require('../controllers/dispositivos.controller');
const auth = require('../middlewares/auth.middleware');

router.use(auth);
router.get('/', ctrl.listar);
router.get('/estadisticas', ctrl.estadisticas);
router.get('/:id', ctrl.obtener);
router.post('/', ctrl.crear);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.eliminar);

module.exports = router;
