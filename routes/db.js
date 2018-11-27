let express = require('express');
let router = express.Router();
let DB = require('../controllers/db');

router.get('/db/:table/', DB.db_list);
router.get('/db/:table/add/', DB.db_add);
router.post('/db/:table/add/', DB.db_add_save);
router.get('/db/:table/edit/:id', DB.db_edit);
router.post('/db/:table/edit/', DB.db_edit_save);
router.get('/db/:table/delete/:id', DB.db_delete);

module.exports = router;
