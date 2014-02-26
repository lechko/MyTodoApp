var http = require("http");
var serverURL = "localhost";
var serverPort = 3000;

function login(user, pass) {
	var options = {
		hostname : serverURL,
		port : serverPort,
		path : '/login',
		method : 'POST'
	};
	var req = http.request(options, function (res) {
		console.dir(res.headers);
	});
	req.write(JSON.stringify({'username' : user, 'password' : pass}));
	req.end();
}

function register(name, user, pass) {
	var userStr = JSON.stringify({fullname : name, username : user, password : pass});

	var options = {
		hostname : serverURL,
		port : serverPort,
		path : '/register',
		method : 'POST',
		headers: {
			'Content-Length' : userStr.length
		}
	};
	var req = http.request(options, function (res) {
		var cookie = res.headers['set-cookie'];
		startTests(cookie);
	});
	
	req.write(userStr);
	req.end();
}

function startTests(cookie) {
	var testIndex = 0;
	var options = {
		hostname: serverURL,
		port: serverPort,
		headers: {
			'Cookie' : cookie
		}
	};

	function nextTest() {
		if (testIndex > tests.length - 1) {
			printResults();
			return;
		}

		process.nextTick(function () {
			tests[testIndex-1].start(options, nextTest);
		});

		testIndex++;
	}

	nextTest();
}

function printResults() {
	console.log('results:');
	console.log('----------------------------------------------');
	tests.forEach(function (test) {
		console.log(test.name);
		console.log(test.responseBody);
		console.log(test.result);
		console.log('----------------------------------------------');
	});
}

function addItem(options, item, callback) {
	options.method = 'POST';
	options.path = '/items';

	var itemStr = JSON.stringify(item);
	options.headers['Content-Length'] = itemStr.length;

	var req = http.request(options, function (res) {
		getResponseBody(res, callback);
	});
	
	req.write(itemStr);
	req.end();
}

function updateItem(options, item, callback) {
	options.method = 'PUT';
	options.path = '/items';

	var itemStr = JSON.stringify(item);
	options.headers['Content-Length'] = itemStr.length;

	var req = http.request(options, function (res) {
		getResponseBody(res, callback);
	});
	
	req.write(itemStr);
	req.end();
}

function removeItem(options, item, callback) {
	options.method = 'DELETE';
	options.path = '/items';

	var itemStr = JSON.stringify(item);
	options.headers['Content-Length'] = itemStr.length;

	var req = http.request(options, function (res) {
		getResponseBody(res, callback);
	});
	
	req.write(itemStr);
	req.end();
}

function getResponseBody(res, callback) {
	res.body = '';
	res.setEncoding('utf8');
	var len = parseInt(res.headers['content-length'], 10);
	res.on('data', function (data) {
		res.body += data;
		
		if (res.body.length >= len) {
			callback(res);
		}
	});
}

var tests = [
	{
		name: 'add todo',
		start: function (options, next) {
			var self = this;
			var item = {id: 1, value: 'my first todo', status: 0};
			addItem(options, item, function (res) {
				self.responseBody = res.body;
				if (res.statusCode != 200) {
					self.result = "failure";
					return next();
				}

				self.result = "success";
				return next();
			});
		}
	},
	{
		name: 'add todo (with bad params)',
		start: function (options, next) {
			var self = this;
			var item = {id: 2, fakeparam: 'my first todo', status: 0};
			addItem(options, item, function (res) {
				self.responseBody = res.body;
				if (res.statusCode != 400) {
					self.result = "failure";
					return next();
				}

				self.result = "success";
				return next();
			});
		}
	},
	{
		name: 'add todo (with existing ID)',
		start: function (options, next) {
			var self = this;
			var item = {id: 1, value: 'new todo same ID', status: 0};
			addItem(options, item, function (res) {
				self.responseBody = res.body;
				if (res.statusCode != 500) {
					self.result = "failure";
					return next();
				}

				self.result = "success";
				return next();
			});
		}
	},
	{
		name: 'get todos',
		start: function (options, next) {
			var self = this;
			var req;
			
			options.path = '/items';
			options.method = 'GET';
			delete options.headers['Content-Length'];
			req = http.request(options, function (res) {
				getResponseBody(res, function (res) {
					self.responseBody = res.body;
					if (res.statusCode != 200) {
						self.result = "failure";
						return next();
					}

					self.result = "success";
					return next();
				});
			});
			req.end();
		}
	},
	{
		name: 'update todo (with ID that does not exist)',
		start: function (options, next) {
			var self = this;
			var item = {id: 3, value: "updated", status: 1};
			updateItem(options, item, function (res) {
				self.responseBody = res.body;
				if (res.statusCode != 400) {
					self.result = "failure";
					return next();
				}

				self.result = "success";
				return next();
			});
		}
	},
	{
		name: 'update todo (change text and state)',
		start: function (options, next) {
			var self = this;
			var item = {id: 1, value: "updated todo", status: 1};
			updateItem(options, item, function (res) {
				self.responseBody = res.body;
				if (res.statusCode != 200) {
					self.result = "failure";
					return next();
				}

				self.result = "success";
				return next();
			});
		}
	},
	{
		name: 'remove todo (with ID that does not exist)',
		start: function (options, next) {
			var self = this;
			var item = {id: 2};
			removeItem(options, item, function (res) {
				self.responseBody = res.body;
				if (res.statusCode != 400) {
					self.result = "failure";
					return next();
				}

				self.result = "success";
				return next();
			});
		}
	},
	{
		name: 'remove todo',
		start: function (options, next) {
			var self = this;
			var item = {id: 1};
			removeItem(options, item, function (res) {
				self.responseBody = res.body;
				if (res.statusCode != 200) {
					self.result = "failure";
					return next();
				}

				self.result = "success";
				return next();
			});
		}
	}
];

register("myname", "myuser", "mypass");