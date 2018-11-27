var DB = require('../models/db');

exports.db_list = function (req, res) {
    DB.db_list(req, res, function (page_title, data) {
        res.render('db_list', { page_title: page_title, data: data });
    });
}

exports.db_add = function (req, res) {
    DB.db_add(req, res, function (page_title, data) {
        res.render('db_add', { page_title: page_title, data: data });
    });
}

exports.db_add_save = function (req, res) {
    DB.db_add_save(req, res, function () {
        res.redirect('/db/' + req.params.table + '/');
    });
}

exports.db_edit = function (req, res) {
    DB.db_edit(req, res, function (page_title, data) {
        res.render('db_edit', { page_title: page_title, data: data });
    });
}

exports.db_edit_save = function (req, res) {
    DB.db_edit_save(req, res, function (table) {
        res.redirect('/db/' + req.params.table + '/');
    });
}

exports.db_delete = function (req, res) {
    DB.db_delete(req, res, function (table) {
        res.redirect('/db/' + req.params.table + '/');
    });
}
