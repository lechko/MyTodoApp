var express = require("./server/miniExpress"),
	http = require('./server/miniHttp'),
	path = require("path"),
	app = express();
var data = require('./server/data');
var todos = data();

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

console.log('Starting web server...');

app	.use(express.cookieParser())
	.use(express.static(__dirname + "/www/"))
	.post('/register', todos.registerUser())
	.post('/login', todos.userLogin())
	.use(auth)
	.use('/item', todos.validateItem())
	.get('/item', todos.getItem())
	.post('/item', todos.postItem())
	.put('/item', todos.putItem())
	.delete('/item', todos.deleteItem())
	.use(express.pageNotFound());

var port = Number(process.env.PORT || 3000);
console.log("try to listen on port: " + port);
app.listen(port);