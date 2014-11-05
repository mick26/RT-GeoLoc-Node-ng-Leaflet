/*=========================================================
Michael Cullen
server.js

2014
Working - (Tá se ag obair)

Ref.
http://thunderforest.com/
http://pixelhunter.me/post/33363373922/realtime-geolocation
http://tympanus.net/codrops/2012/10/11/real-time-geolocation-service-with-node-js/
https://github.com/voronianski/realtime-geolocation-demo
https://www.npmjs.org/package/node-static
http://tombatossals.github.io/angular-leaflet-directive/#!/examples/geojson
============================================================*/

'use strict';

/* ========================================================== 
External Modules/Packages Required
============================================================ */
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var colours = require('colors');
var logger = require('morgan');
var errorHandler = require('errorhandler');

/* ========================================================== 
Port the server will listen on
============================================================ */
app.set('port', process.env.PORT || 3000);

/* ==========================================================
serve the static index.html from the public folder
============================================================ */
app.use(express.static(__dirname + '/public'));


//development only
if (app.get('env') === 'development') {
    app.use(errorHandler());
    app.use(logger('dev'));
}

//production only
if (app.get('env') === 'production') {
    // TODO
};



/* ========================================================== 
SOCKET.IO
============================================================ */
io.on('connection', function (socket) {

	/*
	 * When Node receives a users co-ords
	 * Broadcast them to all other users
	 */
	socket.on('send:coords', function (data) {
		socket.broadcast.emit('load:coords', data);
	});

});


/* ========================================================== 
Start server listening on a port
============================================================ */
http.listen(app.get('port'), function(req, res) {
    console.log('Express server listening on port ' .green + app.get('port') );
});




