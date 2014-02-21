var uuid = require('node-uuid');

module.exports = function () {
	var that = this;

	var Items = {}; //user:[Item objects]
	var users = {}; //{user objects}
	var sessions = {}; //user:session

	// Items object contains Items-per-User pairs, 
	//i.e., keys are userIds, values are arrays of Todos


	

	this.registerUser = function () {
		return function (req, res, next) {
			// body should be a json that holds fullname, username, password
			try {
				var userDetails = JSON.parse(req.body);
				if (!(userDetails.username && userDetails.password && userDetails.fullname)) {
					// not valid as new user's data
					res.status(400);
					res.json({status: 1, msg: "Missing user details"});
					return;
				}
				if (users[userDetails.username]) { //username already exists
					res.status(500);
					res.json({status: 1, msg: "Username already exists"});
					return;
				}
				
				// add user to DB
				users[userDetails.username] = {fullname: userDetails.fullname, password: userDetails.password};

				// create sessionId for user
				sessions[userDetails.username] = uuid.v1();
				// set cookie with sessionId and send
				res.cookie('key', sessions[userDetails.username]);
				res.status(200);
				res.send("");

			} catch (ex) {
				console.log(Date() + " registering user error:");
				console.dir(ex);
				res.status(500);
				res.json({status:1, msg: "internal error.\r\nmake sure request's content was a valid JSON"});
			}
		};
	};

	this.userLogin = function () {
		return function (req, res, next) {
			// body should be a json that holds username and password
			try {
				var userDetails = JSON.parse(req.body);
				if (!(userDetails.username && userDetails.password)) {
					// not valid as new user's data
					res.status(400);
					res.json({status: 1, msg: "Missing login details"});
					return;
				}
				// check username and password
				if (!users[userDetails.username] ||
						users[userDetails.username].password !== userDetails.password) {
					res.status(500);
					res.json({status: 1, msg: "incorrect username or password"});
					return;
				}
				// create sessionId for user
				sessions[userDetails.username] = uuid.v1();
				// set cookie with sessionId and send
				res.cookie('key', sessions[userDetails.username]);
				res.status(200);
				res.send("");

			} catch (ex) {
				console.log(Date() + " login user in error:");
				console.dir(ex);
				res.status(500);
				res.json({status:1, msg: "internal error.\r\nmake sure request's content was a valid JSON"});
			}
		};
	};

	this.findUserBySessionId = function (sessionId) {
		var match = Object.keys(sessions).filter(function (username) {
			if (sessions[username] === sessionId)
				return true;
			return false;
		});
		if (match.length !== 1) {
			if (match.length > 1) {
				// more than one match - conflict, remove both
				match.forEach(function (conflictingName) {
					delete sessions[conflictingName];
				});
			}
			return undefined;
		}
		return match[0];
	};

	var getItemIndex = function (user, itemId) {
		if (!Items[user]) {
			return -1;
		}
		var firstMatchingIndex; // there should only be one anyway
		var exists = Items[user].some(function (element, index) {
			if (element.id === itemId) {
				firstMatchingIndex = index;
				return true;
			}
			return false;
		});
		if (exists) {
			return firstMatchingIndex;
		}
		return -1;
	};

	that.getItem = function () {
		return function (req, res, next) {
			if (!req.user) {
				next(req,res);
				return;
			}
			var userItems = Items[req.user];
			if (!userItems) {
				userItems = [];
			}
			res.status(200);
			res.json(userItems);
		};
	};

	that.postItem = function () {
		return function (req, res, next) {
			if (!req.user) {
				next(req,res);
				return;
			}
			try {
				var sameIdIndex = getItemIndex(req.user, req.body.id);
				if (sameIdIndex !== -1) { // item already exists
					res.status(500);
					res.json({status: 1, msg: "item id already exists"});
					return;
				}
				if (!Items[req.user]) {
					//create entry for user
					Items[req.user] = [];
				}
				// add item for user and respond
				Items[req.user].push({id: req.body.id, value: req.body.value, completed:false});
				res.json({status: 0});
			} catch (ex) {
				console.log(Date());
				console.dir(ex);
				res.status(500);
				res.json({status: 1, msg: "internal error"});
			}
		};
	};

	that.putItem = function () {
		return function (req, res, next) {
			if (!req.user) {
				next(req,res);
				return;
			}
			try {
				var sameIdIndex = getItemIndex(req.user, req.body.id);
				if (sameIdIndex !== -1) {
					var itemToUpdate = Items[req.user][sameIdIndex];
					if (req.body.value)
						itemToUpdate.value = req.body.value;
					if (req.body.status !== undefined) {
						if (req.body.status == 1) {
							itemToUpdate.completed = true;
						}
						else {
							itemToUpdate.completed = false;
						}
					}
					res.json({status: 0});
					return;
				}
				res.json({status: 1, msg: "requested item doesnt exist for user"});
			} catch (ex) {
				console.log(Date());
				console.dir(ex);
				res.status(500);
				res.json({status: 1, msg: "internal error"});
			}
		};
	};

	that.deleteItem = function () {
		return function (req, res, next) {
			if (!req.user) {
				next(req,res);
				return;
			}
			try {
				if (req.body.id == -1 && Items[req.user]) {
					Object.keys(Items[req.user]).reverse().forEach (function (index) {
						if (Items[req.user][index].completed === true) {
							Items[req.user].splice(index,1);
						}
					});
					if (Items[req.user].length === 0) {
						delete Items[req.user];
					}
					
					res.json({status: 0});
					return;
				}
				var sameIdIndex = getItemIndex(req.user, req.body.id);
				if (sameIdIndex !== -1) {
					Items[req.user].splice(sameIdIndex, 1);
					res.json({status: 0});
					return;
				}
				res.json({status: 1, msg: "requested item doesnt exist for user"});
			} catch (ex) {
				console.log(Date());
				console.dir(ex);
				res.status(500);
				res.json({status: 1, msg: "internal error"});
			}
		};
	};

	that.validateItem = function () {
		// check item is of legal form and parse it to JSON
		return function (req,res, next) {
			if (req.method === 'GET') { // no need to JSON the body
				next(req, res);
				return;
			}
			try {
				// data must have been sent using JSON.stringify
				req.body = JSON.parse(req.body);

				if (req.body.id) {
					next(req, res);
					return;
				}
				res.json({status: 1, msg: "missing id of item requested"});
			} catch (ex) {
				console.log(Date() + " in validateItem");
				console.dir(ex);
				res.status(500);
				res.json({status:1, msg: "internal error.\r\nmake sure request's content was a valid JSON"});
			}
		};
	};

	return that;
};


// TODO: ASSUMPTIONS NEEDED TO BE CHECKED
// - auth sets req.user according to session id
// - we are allowed to assume the requests are given to us from knowm source (ours), and therefor we can assume they used JSON.stringify on them
//		- it doesnt mean we can assume trusted source (hence eval() not allowed even if its helpfull)
// - we respond with error 500 for bad id, however we respond with 200 OK and {status:1} in case there is no id in the item of the request
// - every function here assumes auth was run before and got here only if sessionId is valid
// - regarding auth() - if cookie invalid, we need to return 400 and show login page.
//					  assumption is that we can perform the redirection in the client side.
//					  (otherwise the only way to make the browser redirect automatically is
//						setting 3xx response with location header, however we are requested to return 400 response)

