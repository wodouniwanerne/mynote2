//加载依赖库
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var session = require('express-session');
var moment = require('moment');

//引入 mongoose
var mysql = require('mysql');

//引入模型
//var models = require('./models/models');

var checkLogin = require('./checkLogin.js');

//使用 mongoose 连接服务
/*mongoose.connect('mongodb://localhost:27017/notes');
mongoose.connection.on('error', console.error.bind(console, '连接数据库失败'));*/


//创建express 实例

var app = express();

//定义EJS模板引擎和模板文件位置
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//定义静态文件目录
app.use(express.static(path.join(__dirname, 'public')));

//定义数据解析器
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//建立 session 模型
app.use(session({
	secret: '1234',
	name: 'mynote',
	cookie: {maxAge: 1000 * 60 * 60 * 24 * 14},  //设置session的保存时间为2周
	resave: false,
	saveUninitialized: true
}));

//var User = models.User;
//var Note = models.Note;
var db = mysql.createConnection({
		host:'localhost',
		user:'mynote',
		password:'123456',
		database:'mynote'
	});

//响应首页get请求
app.get('/', checkLogin.noLogin);
app.get('/', function(req, res) {

	/*Note.find({author:req.session.user.username}).exec(function(err, allNotes) {
			if (err) {
				console.log(err);
				return res.redirect('/');
			}
			res.render('index', {
				user:req.session.user,
				title:'首页',
				notes:allNotes
			});
	});*/

	db.query("SELECT * FROM article WHERE author='"+req.session.user[0].username+"'", function (err, allNotes) {
		if (err) {
			console.log(err);
			return res.redirect('/');
		}
		res.render('index', {
				user:req.session.user,
				title:'首页',
				notes:allNotes
		});
		
	});
});

app.get('/detail/:_id', checkLogin.noLogin);
app.get('/detail/:_id', function(req, res) {
	console.log('查看笔记！');
	/*Note.findOne({_id:req.params._id}).exec(function(err, art) {
			if (err) {
				console.log(err);
				return res.redirect('/');
			}

			if (art) {
				res.render('_id', {
					title:'笔记详情',
					user:req.session.user,
					art:art,
					moment:moment
				});
			}
	});*/
db.query("SELECT * FROM article WHERE author='"+req.session.user[0].username+"'", function (err, allNotes) {

	db.query("SELECT * FROM article WHERE title='"+req.params._id+"'", function (err, art) {
		if (err) {
			console.log(err);
			return res.redirect('/');
		}

		if (art) {
			res.render('_id', {
				title:'笔记详情',
				user:req.session.user,
				art:art,
				moment:moment
			});
		}
		
	});
});
});

var mistake = 0;

app.get('/register', function(req, res) {
	if (req.session.user == null) {
		console.log('注册！');	
		res.render('register', {
			user:req.session.user,
			mistake:mistake,
			title:'注册'
		});
	} else {
		console.log('您已经登录！');
		return res.redirect('/');
	}
});

//post请求
app.post('/register', function(req, res) {
	// req.body 可以获取到表单的每项数据
	var username = req.body.username,
	    password = req.body.password,
	    passwordRepeat = req.body.passwordRepeat;
	
	
	

	//判断用户名长度以及是否为字母数字等

	var checkusername = /^\w{3,20}$/;
	if (!(checkusername.test(username.trim()))) {
		console.log('用户名只能是字母数字或下划线，且长度在3到20之间');
		return res.redirect('/register');
	}


	//检查输入的用户名是否为空，使用trim去掉两端空格
	if (username.trim().length == 0) {
		
		console.log('用户名不能为空！');
		return res.redirect('/register');
	}

	//判断密码长度以及是否同时包含大小写字母与数字

	var checkpassword  = /^(?=.{6,})(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).*$/;
	if (!(checkpassword.test(password.trim()))) {
		console.log('密码必须同时包含大小写字母数字，且长度不小于6');
		return res.redirect('/register');
	}

	//检查输入的密码是否为空，使用trim去掉两端空格
	if (password.trim().length == 0 || passwordRepeat.trim().length == 0) {
		console.log('密码不能为空！');
		return res.redirect('/register');
	}

	//检查两次输入的密码是否一致
	if (password != passwordRepeat) {
		console.log('两次输入的密码不一致！');
		return res.redirect('/register');
	}

	//检查用户名是否存在，如果不存在，则保存该条记录
	/*User.findOne({username:username}, function(err, user) {
		if (err) {
			console.log(err);
			return res.redirect('/register');
		}

		if (user) {
			console.log('用户名已存在');
			mistake = 1;
			return res.redirect('/register');
		}

		//对密码进行md5加密
		var md5 = crypto.createHash('md5'),
		    md5password = md5.update(password).digest('hex');

		//新建user对象用于保存数据
		var newUser = new User({
			username: username,
			password: md5password
		});

		newUser.save(function(err, doc) {
			if (err) {
				console.log(err);
				return res.redirect('/register');
			}
			console.log('注册成功！');
			return res.redirect('/');
		});
	});*/

	db.query("SELECT * FROM user WHERE username='"+username+"'", function (err, data) {
		if (err) {
			console.log(err);
			return res.redirect('/register');
		}
		
		if (data.length > 0) {
			console.log('用户名已存在');
			mistake = 1;
			return res.redirect('/register');
		}
		//对密码进行md5加密
		var md5 = crypto.createHash('md5'),
		    md5password = md5.update(password).digest('hex');
		db.query("INSERT INTO user(username, password, submission_date) VALUES('"+username+"', '"+md5password+"', now())", function (err, data) {
			if (err) {
				console.log('数据库出错');
				return res.redirect('/register');
			}
			console.log('注册成功！');
			return res.redirect('/');
		});
	});
});

app.get('/login', function(req, res) {

	if (req.session.user == null) {
		console.log('登录！');
		res.render('login', {
			user:req.session.user,
			title:'登录'
		});
	} else {
		console.log('您已经登录！');
		return res.redirect('/');
	}

});

app.post('/login', function(req, res) {
	var username = req.body.username,
		password = req.body.password;
	
	


	//判断用户名

	var checkusername = /^\w{3,20}$/;
	if (!(checkusername.test(username.trim()))) {
		console.log('用户名只能是字母数字或下划线，且长度在3到20之间');
		return res.redirect('/login');
	}

	//判断密码
	var checkpassword  = /^(?=.{6,})(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).*$/;
	if (!(checkpassword.test(password.trim()))) {
		console.log('密码必须同时包含大小写字母数字，且长度不小于6');
		return res.redirect('/login');
	}



	/*User.findOne({username:username}, function(err, user) {
		if (err) {
			console.log(err);
			return res.redirect('/login');
		}
		if (!user) {
			console.log('用户不存在！');
			return res.redirect('/login');
		}
		//对密码进行md5加密
		var md5 = crypto.createHash('md5'),
			md5password = md5.update(password).digest('hex');
		if (user.password !== md5password) {
			console.log('密码错误！');
			return res.redirect('/login');
		}
		console.log('登陆成功！');
		user.password = null;
		delete user.password;
		req.session.user = user;
		return res.redirect('/');
	});*/

	db.query("SELECT * FROM user WHERE username='"+username+"'", function (err, data) {
		if (err) {
			console.log(err);
			return res.redirect('/login');
		}
		if (data.length == 0) {
			console.log('用户名不存在');
			return res.redirect('/login');
		}
	
		//对密码进行md5加密
		var md5 = crypto.createHash('md5'),
		    md5password = md5.update(password).digest('hex');

		if (data[0].password !== md5password) {
			console.log('密码错误！');
			return res.redirect('/login');
		}

		console.log('登录成功！');
		data.password = null;
		delete data.password;
		req.session.user = data;
		return res.redirect('/');
	});
});


app.get('/quit',function(req, res) {
	req.session.user = null;
	console.log('退出!');
	return res.redirect('/login');
});

app.get('/post', checkLogin.noLogin);
app.get('/post', function(req, res) {
	console.log('发布！');
	res.render('post', {
		user:req.session.user,
		title:'发布'
	});
});


app.post('/post', function(req, res) {
	/*var note = new Note({
		title:req.body.title,
		author:req.session.user.username,
		tag:req.body.tag,
		content:req.body.content
	});

	note.save(function(err, doc) {
		if (err) {
			console.log(err);
			return res.redirect('/post');
		}
		console.log('文章发表成功！');
		return res.redirect('/');
	});*/
	db.query("INSERT INTO article(title, author, tag, content, submission_date) VALUES('"+req.body.title+"','"+req.session.user[0].username+"', '"+req.body.tag+"', '"+req.body.content+"', now())", function (err, data) {
			if (err) {
				console.log('数据库出错');
				return res.redirect('/post');
			}
			console.log('文章发表成功！');
			return res.redirect('/');
	});
});

app.get('/detail', checkLogin.noLogin);
app.get('/detail', function(req, res) {
	console.log('查看笔记！');
	/*Note.find({author:req.session.user.username}).exec(function(err, allNotes) {
			if (err) {
				console.log(err);
				return res.redirect('/');
			}
			res.render('detail', {
				user:req.session.user,
				title:'查看笔记',
				notes:allNotes
			});
	});*/

	db.query("SELECT * FROM article WHERE author='"+req.session.user[0].username+"'", function (err, allNotes) {
		if (err) {
			console.log(err);
			return res.redirect('/');
		}
		
			res.render('detail', {
				user:req.session.user,
				title:'查看笔记',
				notes:allNotes
			});
		
		
	});
});

//监听3000端口
app.listen(3002, function(req, res) {
	console.log('app is running at port 3002');
});