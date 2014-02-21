var myTodoMVCApp = angular.module('myTodoMVCApp', [
	'ngRoute'
]);

myTodoMVCApp.config(['$routeProvider',
	function ($routeProvider) {
		$routeProvider
			.when('/login/:reason?', {
				templateUrl: 'partials/login.html',
				controller: 'LoginCtrl'
			})
			.when('/register/:reason?', {
				templateUrl: 'partials/login.html',
				controller: 'LoginCtrl'
			})
			.when('/:filter?', {
				templateUrl: 'partials/todo-list.html',
				controller: 'TodoListCtrl'
			});
	}]);