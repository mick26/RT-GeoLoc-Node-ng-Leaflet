'use strict';

/*================================================
Module - for Services
================================================ */
angular.module('myApp.services', [])


/*
 * Make the socket instance
 */
.factory('socket', function (socketFactory) {
	return socketFactory();
})