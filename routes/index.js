var express = require('express'),
    router = express.Router(),
    Index = require('../controllers/index');

router.get('/', Index.index);

module.exports = router;