myTodoMVCApp.factory('todosService', ['todosHttpService', '$location', function (todosHttpService, $location) {
	var todos = [];

	return new TodoService(todos);

	function TodoService(todos) {
		var self = this;
		var maxId = 0;

		function handleError(data, code) {
			console.log('handleError:');
			console.dir(data);
			switch (code) {
				case 404:
					$location.path('login/no_session');
					break;
				case 400:
					$location.path('login/session_invalid');
					break;
				default:
					//ignore	
			}
		}

		self.getItems = function (callback) {
			todosHttpService.getItems(function (data) {
				todos = data;
				todos.forEach(function (item) {
					if (item.id > maxId)
						maxId = item.id;
				});
				callback(todos);
			}, handleError);
		};

		self.addItem = function (item, callback) {
			// update server
			maxId++;
			var itemToSend = {
				id: maxId,
				value: item.value,
				status: item.completed ? 1 : 0
			};
			item.id = itemToSend.id;

			todosHttpService.addItem(itemToSend, callback, handleError);
		};

		self.removeItem = function (item, callback) {
			var itemToSend = {id: item.id};
			todosHttpService.deleteItem(itemToSend, callback, handleError);
		};

		self.clearCompleted = function (callback) {
			todosHttpService.deleteCompleted(function () {
				var nonCompleted = [];
				todos.forEach (function (item) {
					if (!item.completed) {
						nonCompleted.push(item);
					}
				});
				todos = nonCompleted;
				callback(todos);
			}, handleError);
		};

		self.updateItem = function (item, callback) {
			var itemToSend = {
				id: item.id,
				value: item.value,
				status: item.completed ? 1 :0
			};

			todosHttpService.updateItem(itemToSend, function () {
				callback();
			}, function (data, code) {
				callback({'code': code, 'data': data});
				handleError(data, code);
			});
		};
	}
}]);


