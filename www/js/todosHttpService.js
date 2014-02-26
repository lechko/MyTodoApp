myTodoMVCApp.factory('todosHttpService', ['$http', function ($http) {

	function TodosHttpService() {
		var self = this;
		
		var validatefunc = function (func) {
			if (func instanceof Function) {
				return func;
			}
			return function () {};
		};

		self.getItems = function (callbackSuccess, callbackFailure) {
			$http.get('/items').success(validatefunc(callbackSuccess))
					.error(validatefunc(callbackFailure));
		};

		self.addItem = function (item, callbackSuccess, callbackFailure) {
			$http.post('/items', JSON.stringify(item)).success(validatefunc(callbackSuccess))
					.error(validatefunc(callbackFailure));
		};

		self.updateItem = function (item, callbackSuccess, callbackFailure) {
			$http.put('/items', JSON.stringify(item)).success(validatefunc(callbackSuccess))
					.error(validatefunc(callbackFailure));
		};

		self.deleteItem = function (item, callbackSuccess, callbackFailure) {
			$http.delete('/items', {data: JSON.stringify(item)}).success(validatefunc(callbackSuccess))
					.error(validatefunc(callbackFailure));
		};

		self.deleteCompleted = function (callbackSuccess, callbackFailure) {
			$http.delete('/items', {data: JSON.stringify({id:-1})}).success(validatefunc(callbackSuccess))
					.error(validatefunc(callbackFailure));
		};
	}

	return new TodosHttpService();
}]);