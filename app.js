/**
 * Module dependencies.
 */

var express = require('express'),
    app = express();

// var routes = require('./controllers/index');
var http = require('http');
var path = require('path');
var logger = require('morgan');
var methodOverride = require('method-override');
var errorHandler = require('express-error-handler');

//load db routes
var db_routes = require('./controllers/db');

var connection = require('express-myconnection');
var mysql = require('mysql');

// all environments
app.set('port', process.env.PORT || 9000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//app.use(express.favicon());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/bootstrap-validator/dist')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/js', express.static(__dirname + '/node_modules/popper.js/dist')); // redirect JS popper
app.use('/js', express.static(__dirname + '/node_modules/feather-icons/dist')); // redirect JS popper
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.use('/css', express.static(__dirname + '/node_modules/bootstrap-material-design-icons/css/')); // redirect CSS MD Icons
app.use('/fonts', express.static(__dirname + '/node_modules/bootstrap-material-design-icons/fonts/')); // redirect MD Fonts

// development only
if ('development' == app.get('env')) {
    app.use(errorHandler());
}

/*------------------------------------------
    connection peer, register as middleware
    type koneksi : single,pool and request 
-------------------------------------------*/

app.use(
    connection(mysql, {
        host: 'localhost',
        user: 'node_express_mysql_autocrud',
        password: '1cedaba50d77ac4df92d688c51f11172',
        port: 3306, //port mysql
        database: 'node_express_mysql_autocrud'
    }, 'pool') //or single
);

app.use(require('./routes'));
app.use(require('./routes/db'));

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
