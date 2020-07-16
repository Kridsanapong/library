var express = require('express')
var server = express()
server.listen(80)

var mongo = require('mongodb')
var info = {useNewUrlParser:true, useUnifiedTopology:true}

var ejs = require('ejs')
server.engine('html', ejs.renderFile)

var readBody = express.urlencoded({extended:false})
var sha =require('sha2')

var valid  = []
var cookie = require('cookie-parser')
var readCookie = cookie()

server.get('/list',showMember)
server.get('/book',showBook)
server.get('/profile',readCookie, showProfile)
server.get('/register', saveMember)
server.post('/register', readBody, saveNewmember)
server.get('/login', showLogin)
server.post('/login', readBody, checkPassword)
server.get('/logout',readCookie,showLogout)
server.get('/search',searchBook)
server.get('/admin',readCookie,updateBook,showAdmin)

function showMember(req,res){
	mongo.MongoClient.connect('mongodb://localhost',info, function(error,conn){
		var result = conn.db('member').collection('member').find()
		result.toArray(function (error,data){
			res.send(data)
		})
	})
}
function showBook(req,res){
	mongo.MongoClient.connect('mongodb://localhost',info, function(error,conn){
		var result = conn.db('library').collection('book').find()
		result.toArray(function (error,data){
			res.send(data)
		})
	})
}
function saveMember(req,res){
	res.render('register.html')
}
function saveNewmember(req,res){
	var data = {}
	data.type = 'normal'
	data.email = req.body.email ||''
	data.password = req.body.password||''
	data.name = req.body.name || ''
	data.password =sha.SHA512(data.password).toString("hex")
	mongo.MongoClient.connect('mongodb://localhost',info, function(error,conn){
        var result = conn.db('library').collection('member').insertOne(data,function(error,result){
                        res.redirect('/login')
                })
        })
}
function showLogin (req,res) {
	res.render('login.html')
}
function checkPassword (req,res) {
	var data = {}
	data.email = req.body.email ||''
	data.password = req.body.password ||''
	if(data.email == '' || data.password == ''){
		res.redirect('/login')
	}else {
		var cond = {
			email : req.body.email ,
			password : sha.SHA512(data.password).toString("hex")
		}
		mongo.MongoClient.connect('mongodb://localhost',info,function(error,conn){
		var result = conn.db('library').collection('member').find(cond)
			result.toArray(function (er,data){		
				if(data.length == 1 ){
                        		var token = randomCard()
                        		valid[token] = data[0]
                        		res.header('Set-Cookie', 'card=' + token)
				var model = {member:data[0]}
				if(data[0].type == 'admin'){
					res.render('admin.html',model)
				}	else{				
					res.redirect('/profile')
			}
               			 } else { 
                        		res.redirect('/login?message=Fail')
                       			}
				})
			})
		}
	}
function randomCard() {
	var result = []
	for(var i=0;i<10;i++){
		var r = parseInt(Math.random() * 10000)
		r = '' + r
		while (r.length < 4 ) r ='0' + r
		result.push(r)
	}
	return result.join('-')
}
function showProfile(req,res) {
	var card = req.cookies.card || ''
	if(valid[card]){
		var model = {member:valid[card]}
		res.render('profile.html',model)
	}else {
		res.redirect('/login?message=Please Login')
	}
}
function showLogout(req,res){
	var card = req.cookies.card || ''
	if(valid[card]){
		delete valid[card]
	}
	res.render('logout.html')
}

function searchBook(req,res) {
	if(req.query.book == null){
		res.render('search.html', { all:[] })
	}else {
		var cond = '.*'+req.query.book+'.*'
		mongo.MongoClient.connect('mongodb://localhost',info,function(error,conn){
var result =conn.db('library').collection('book').find({name:{$regex:cond,$options:'i'}},function(er,re){
			re.toArray(function(er,re){
				res.render('search.html',{all:re})
			})
		})
	})
}
}
function showAdmin(req,res) {
	res.render('admin.html')
}
function updateBook(req,res){
	var data ={}
	data.name = req.query.name || ''
	data.price = req.query.price|| ''
	data.rent = req.query.rent||''
	mongo.MongoClient.connect('mongodb://localhost',info,function(error,conn){
	var result = conn.db('library').collection('book').insertOne(data,function(error,result){
			})
		})
	}

