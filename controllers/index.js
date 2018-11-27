var Index = require('../models/index');

exports.index = function (req, res) {
  Index.index(req, res, function () {
    res.render('index', { page_title: 'Hello World' });
  });
};
