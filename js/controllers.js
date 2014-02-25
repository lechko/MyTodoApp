myTodoMVCApp.controller('LoginCtrl', ['$scope', '$routeParams', '$location', '$http', function ($scope, $routeParams, $location, $http) {

	//TODO : this is not the appropriate way to do this, we shouldnt access $$path
	if ($location.$$path.substring(0, '/login'.length) === '/login') {
		$scope.title = "Login";
		$scope.isRegister = false;
	} else {
		$scope.title = "Register";
		$scope.isRegister = true;
	}
	// check if we were relocated here for a reason
	if ($routeParams.reason) {
		if ($routeParams.reason === 'no_session') {
			$scope.reason = "Login to see your TODO-list";
		}
		else if ($routeParams.reason === "session_invalid") {
			$scope.reason = "Session in invalid or has expired";
		}
	}

	// functions to check form validity and submit
	$scope.submitRegister = function () {
		// init all possible error resons (that are not handled automatically by angular)
		$scope.userNameAlreadyExists = false;
		$scope.illegalCharsInName = false;
		$scope.illegalCharsInUsername = false;
		$scope.passwordMismatch = false;

		if ($scope.registerForm.$valid) {
			var err = false;
			// check full name characters
			err = err || ($scope.illegalCharsInName = (null !== $scope.fullName.match(/[^a-z ]+/gi)));
			// check username characters
			err = err || ( $scope.illegalCharsInUsername = (null !== $scope.userName.match(/[^a-z_0-9]+/gi)));
			// check password match verify-password
			err = err || ($scope.passwordMismatch = ($scope.password !== $scope.verify));

			if (err)
				return;
			
			var userToRegister = {
				fullname: $scope.fullName,
				username: $scope.userName,
				password: $scope.password
			};
			$http.post('/register', JSON.stringify(userToRegister))
					.success(function() {
						// good, we got a cookie
						$location.path("/");
					})
					.error(function (data, status) {
						// error means that username already exists
						$scope.userNameAlreadyExists = true;
					});
		}
		else { // go over components of form, see which is invalid and show an appropriate message
			// nothing to do here for now.
		}
	};


	$scope.submitLogin = function () {
		// init all possible error resons (that are not handled automatically by angular)
		$scope.illegalCharsInUsername = false;
		$scope.passwordMismatch = false;

		if ($scope.loginForm.$valid) {
			var err = false;
			// check username characters
			err = err || ( $scope.illegalCharsInUsername = (null !== $scope.userName.match(/[^a-z_0-9]+/gi)));
			if (err)
				return;
			
			var userToLogin = {
				username: $scope.userName,
				password: $scope.password
			};
			$http.post('/login', JSON.stringify(userToLogin))
					.success(function() {
						// good, we got a cookie
						$location.path("/");
					})
					.error(function (data, status) {
						// error means that username already exists
						$scope.passwordMismatch = true;
					});
		}
		else { // go over components of form, see which is invalid and show an appropriate message
			// nothing to do here for now.
		}
	};
}]);




myTodoMVCApp.controller('TodoListCtrl', ['$scope', '$routeParams', 'todosService', function ($scope, $routeParams, todosService) {
	$scope.remainingItems = 0;
	$scope.countCompleted = 0;
	$scope.editedTodo = null;
	$scope.todosFilter = $routeParams.filter;
	if (!$scope.todosFilter)
		$scope.todosFilter = '';
	$scope.newTodo = "";
	$scope.allChecked = false;
	$scope.validUser = false;
	//$scope.todos = todosService.getItems();
	$scope.todos = [];
	todosService.getItems(function (todos) {
		$scope.validUser = true;
		$scope.todos = todos;
	});

	$scope.shouldDisplay = function () {
		return function (todo) {
			if (!$scope.todosFilter)
				return true;

			return (todo.completed && $scope.todosFilter === 'completed') ||
					(!todo.completed && $scope.todosFilter === 'active');
		};
	};

	$scope.addItem = function () {
		if ($scope.newTodo.length > 0) {
			var newItem = {value: $scope.newTodo, completed:false};
			todosService.addItem(newItem, function () {
				$scope.todos.push(newItem);
			});
			$scope.newTodo = "";
		}
	};

	$scope.removeItem = function (item) {
		todosService.removeItem(item, function () {
			$scope.todos.splice($scope.todos.indexOf(item), 1);
		});
	};

	$scope.markAll = function (state) {
		$scope.todos.forEach(function (item) {
			if (item.completed !== state) {
				item.completed = state;
				$scope.updateCompleted(item);
			}
		});
	};

	$scope.editItem = function (item) {
		$scope.editedTodo = item;
		// Clone the original todo to restore it on demand.
		$scope.originalTodo = angular.extend({}, item);
	};

	$scope.doneEditing = function (item) {
		$scope.editedTodo = null;
		item.value = item.value.trim();

		if (!item.value) {
			$scope.removeItem(item);
			return;
		}

		todosService.updateItem(item, function (err) {
			if (err)
				$scope.revertEditing(item);
		});
	};

	$scope.revertEditing = function (item) {
		$scope.todos[$scope.todos.indexOf(item)] = $scope.originalTodo;
		$scope.doneEditing($scope.originalTodo);
	};

	$scope.clearCompleted = function () {
		todosService.clearCompleted(function (items) {
			$scope.todos = items;
		});
	};

	$scope.updateCompleted = function (item) {
		todosService.updateItem(item, function (err) {
			if (err)
				item.completed = !item.completed;
		});
	};

	$scope.$watch('todos', function () {
		console.log("todos changed");
		// check how many active/completed items are there.
		$scope.countCompleted = $scope.todos.filter (function (item) {
			return item.completed;
		}).length;
		$scope.remainingItems = $scope.todos.length - $scope.countCompleted;

		// update allChecked accordingly
		if ($scope.countCompleted === $scope.todos.length) {
			$scope.allChecked = true;
		}
		else {
			$scope.allChecked = false;
		}
	}, true);
}]);

