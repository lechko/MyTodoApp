var express = require("./miniExpress"),
	http = require('./miniHttp'),
	path = require("path"),
	app = express();
var data = require('./data');
var todos = data();
var rootFolder = path.normalize(__dirname + "/../");

function auth(req, res, next) {
	// verify user and set req.user

	if (req.cookies && req.cookies["key"]) {
		var sessionId = req.cookies["key"];
		var user = todos.findUserBySessionId(sessionId);
		if (!user) {
			// if sessionId unknown or expired return error 400
			res.status(400);
			res.json( {status: 1, msg: "unknown session key"});
			return;
		}
		req.user = user;
	}
	// continue
	next(req, res);
}


app	.use(express.cookieParser())
	.use(express.static(rootFolder))
	.post('/register', todos.registerUser())
	.post('/login', todos.userLogin())
	.use(auth)
	.use('/item', todos.validateItem())
	.get('/item', todos.getItem())
	.post('/item', todos.postItem())
	.put('/item', todos.putItem())
	.delete('/item', todos.deleteItem())
	.use(express.pageNotFound());

app.listen(1234);