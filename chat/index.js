var app = require('express')();
var fs = require('fs'); // required for file serving

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies



users = [];
// messages = [];


// function waitAndDo(times) {
//   if(times < 1) {
//     return;//thread.kill();
//   }

//   //setTimeout clear the call stack so we dont have to worry about stack overflow on the recursive calls =D
//   setTimeout(function() {

//     // Do something here
//     //console.log('users',users);
//     io.emit('are you there?')

//     var now = new Date()
//     for(var i = 0; i< users.length; i++){
//     	if(now > users[i].dueDate){
//     		console.log('\nuser removed',users[i])
//     		users.splice(i,1)

//     	}else{
//     		//console.log(users[i])
//     		//console.log(now)
//     	}
//     }

//     waitAndDo(times-1);
//   }, 2000);
// }

// const spawn = require('threads').spawn;
 
// const thread = spawn(function(input, done) {
//   // Everything we do here will be run in parallel in another execution context. 
//   // Remember that this function will be executed in the thread's context, 
//   // so you cannot reference any value of the surrounding code. 
//   done({ string : input.string, integer : parseInt(input.string) });
// });
 
// thread
//   .send({ string : '123' })
//   // The handlers come here: (none of them is mandatory) 
//   .on('message', function(response) {

  	
//     waitAndDo(1000);
//     thread.kill();
//   })
//   .on('error', function(error) {
//     console.error('Worker errored:', error);
//   })
//   .on('exit', function() {
//     //console.log('Worker has been terminated.');
//   });







var http = require('http').Server(app);
var io = require('socket.io')(http);

var mysql  = require('mysql');

// var conn = mysql.createConnection({
// 	host     : 'localhost',
// 	user     : 'root',
// 	password : 'root',
// 	database : 'chat'
// });
// conn.connect();

var pool      =    mysql.createPool({
    connectionLimit : 100, //important
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'chat',
    debug    :  false
});


// conversaName VARCHAR(25) NOT NULL,
// sendDate datetime NOT NULL,
// fromUser VARCHAR(25) NOT NULL,
// toUser VARCHAR(25) NOT NULL,
// content text NOT NULL

var insertMessage = function(message){

	pool.getConnection ( function(err,conn){
        if (err) {
          conn.release();
          response.status = "CONNECTION ERROR"
          res.json(response);
          return;
        }   

        var newMessage = {conversaName: message.conversaName, sendDate: new Date(message.sendDate), fromUser:message.fromUser,  toUser:message.toUser, content:message.content}
        var query = conn.query("INSERT INTO messages SET ? ", newMessage, function(err, result) {
		  // Neat!
		  if(err){
		  	console.log('erro',err)
		  }
		});
		//console.log(query.sql); // INSERT INTO posts SET `id` = 1, `title` = 'Hello MySQL'

		
	});

}

var deleteMessage = function(message){
	pool.getConnection ( function(err,conn){
        if (err) {
         	conn.release();
       		return
        }   

        // var statement = "delete from messages where toUser = '"+message.toUser+"' and fromUser = '"+message.fromUser+"' and sendDate = '"+ message.sendDate +"'"
        var statement = "delete from messages where toUser = '"+message.toUser+"' and fromUser = '"+message.fromUser+"' and content = '"+ message.content +"'"
        conn.query(statement, function(err, result) {
		 	// Neat!
			if(err){
				console.log('erro',err)
			}
		});
	});
}

var sendUnreceivedMessagesTo = function(user,socketId){
	pool.getConnection ( function(err,conn){
        if (err) {
          conn.release();
          response.status = "CONNECTION ERROR"
          res.json(response);
          return;
        }   

      	query = "SELECT * from messages where toUser = '"+ user+"' ORDER BY sendDate ASC"
		conn.query(query, function(err, rows, fields) {
		
			if (!err){
				
				if(rows.length > 0){
					var messages = []

					// console.log(rows[0].content)
					for(var i = 0; i < rows.length; i++){
						var newMessage = {conversaName: rows[i].conversaName, sendDate: new Date(rows[i].sendDate), fromUser:rows[i].fromUser,  toUser:rows[i].toUser, content:rows[i].content}
						// messages.push(newMessage)
						io.to(socketId).emit('private message',newMessage);



					}

					return messages
				}
			}else{
				console.log('erro', err)
			}
		})


		var statement = conn.query("delete from messages where toUser = '"+user+"'", function(err, result) {
		  // Neat!
		  if(err){
		  	console.log('erro',err)
		  }
		});
		
	});
}

app.post('/signUp', function(req, res){

	response = {valid: false, status:'none'}


	var username = req.param('username');
	var password = req.param('password');
	var email = req.param('email');

	console.log(username,email,password)

	pool.getConnection ( function(err,conn){
        if (err) {
          conn.release();
          response.status = "CONNECTION ERROR"
          res.json(response);
          return;
        }   
        console.log('connected as id ' + conn.threadId);
        query = "SELECT * from users where username = '"+ username + "' or email = '"+email+"'"
		conn.query(query, function(err, rows, fields) {

			
			if (!err){
				
				if(rows.length > 0){

					response.status = 'INVALID USERNAME OR EMAIL'
					console.log(response)

					conn.release();
					res.send(response)
				}
				else{

					var user = {username:username, password:password, email:email, date : new Date(), authenticationTime : new Date() ,  status : 0 , userKey :'' , IP:'', port: 1}
			        var query = conn.query("INSERT INTO users SET ? ", user , function(err, result) {
					  // Neat!
					  if(err){
					  	console.log('erro',err)
					  	response.status = "SQL ERROR"
					  	res.send(response)	
					  }
					});
					
					response.valid = true
					response.status = "OK"
					conn.release();
					res.send(response)	
				}
			
			}
			else{
				response.status='SQL ERROR'
				console.log(response)
				conn.release();
				res.send(response)	
			}
		});
	});
});


//{username : "douglas", password : "123", email : "douglascastrorj@gmail.com" }
app.post('/login', function(req, res){

	response = {valid: false, status:'none'}


	var username = req.param('username');
	var password = req.param('password');

	console.log(username,password)

	pool.getConnection ( function(err,conn){
        if (err) {
          conn.release();
          response.status = "CONNECTION ERROR"
          res.json(response);
          return;
        }   
        console.log('connected as id ' + conn.threadId);
        query = "SELECT * from users where username = '"+ username + "' and password = '"+password+"'"
		conn.query(query, function(err, rows, fields) {

			
			if (!err){
				
				if(rows.length > 0){


					response.valid = true
					response.status = 'OK'
					console.log(response)

					//update user status
					query2 = "UPDATE users SET status='1' WHERE username='" + username + "';";
					conn.query(query2, function(err, rows, fields) { 
						if (err){
							console.log(err)
						}
					})


					conn.release();
					res.send(response)
				}
				else{
					response.status = 'INVALID USER'
					console.log(response)
					conn.release();
					res.send(response)	
				}
			
			}
			else{
				response.status='SQL ERROR'
				console.log(response)
				conn.release();
				res.send(response)	
			}
		});
	});
});


app.post('/logout', function(req, res){

	var username = req.param('username');
	var password = req.param('password');

	response = {valid: false, status:'none'};

	pool.getConnection ( function(err,conn){
        if (err) {
          conn.release();
          response.status = "CONNECTION ERROR"
          res.json(response);
          return;
        }   

        console.log('connected as id ' + conn.threadId);

		query = "SELECT * from users where username = '"+ username + "' and password = '"+password+"'"
		conn.query(query, function(err, rows, fields) {

			


			if (!err){
				
				if(rows.length > 0){
					response.valid = true
					response.status = 'OK'
					console.log(response)

					users = users.filter(user => user.username !== username);
					console.log('users: ',users)

					query2 = "UPDATE users SET status='0' WHERE username='" + username + "';";
					conn.query(query2, function(err, rows, fields) { 
						if (err){
							console.log(err)
						}
					})

					conn.release();
					res.send(response)		
				}
				else{
					response.status = 'INVALID USER'
					console.log(response)
					conn.release();
					res.send(response)	
				}
			
			}
			else{
				response.status='SQL ERROR'
				console.log(response)
				conn.release();
				res.send(response)	
			}

		});
	});


});




io.on('connection', function(socket){

	console.log('a user has connected on socket')
	socket.on('disconnect', function () {

      console.log('disconnected')
      user = users.find(user => user.socketId == socket.id)

      if(user != undefined){
		console.log('a user has disconnected: ',user)
		var i = users.indexOf(user)
		users.splice(i,1)
      }

	});

	
	socket.on('mensagem', function(msg){
		io.emit('mensagem', msg);
	});
	


	// funcionalidades do servidor do chat 
	socket.on('signUp',function(user){
		//add user on database
		//users.push({ socketId : socket.id, username: name });
	})



	// FIRST MESSAGE VIA SOCKET BY THE USER TO SERVER
	socket.on('add user',function(name){
		console.log('user added',name)
		var delta_t = 1000 * 15;// delta_t in miliseconds
		//if the user is already in users array, update his socket id
		var user = users.find(x=> x.username === name)
		if(user != undefined){
			user.socketId = socket.id;

			//I HAVE TO FIX THIS
			var now = new Date();
			user.dueDate = new Date(now.getTime() + delta_t);
		}
		//else push user in array
		else{
			
			users.push({ socketId : socket.id, username: name, dueDate: new Date()+ delta_t });	
		}

		//send unreceived messages
		sendUnreceivedMessagesTo( name, socket.id )
	})

	socket.on('yes i am',function(name){
		//console.log(name, ': yes i am ')
		var delta_t = 1000 * 15;// delta_t in miliseconds
		//if the user is already in users array, update his socket id
		//console.log('yes i am:',name)
		var user = users.find(x=> x.username === name)
		if(user != undefined){
			user.socketId = socket.id;


			//I HAVE TO FIX THIS
			var now = new Date();
			user.dueDate = new Date( now.getTime() + delta_t );
		}
		//else push user in array
		else{
			users.push({ socketId : socket.id, username: name, dueDate: new Date()+ delta_t});
			//send unreceived messages
			sendUnreceivedMessagesTo( name, socket.id )
		}

		
	})


	socket.on('new message',function(data){
		console.log(socket.id+' says '+data);
		console.log(users)
	});

	//emit message to a specific user
	// { from: str, to: str, content : str }
	socket.on('send image',function(){
		console.log('image sent')
		fs.readFile(__dirname + '/images/ionic.png', function(err, buf){
		    // it's possible to embed binary data
		    // within arbitrarily-complex objects
		    socket.emit('image', { image: true, buffer: buf.toString('base64') });
		    console.log('image file is initialized');
		});
	})

	socket.on('message to',function(data){

		// store the message until the receiver's confirmation

		//console.log('users: ',users)
		console.log('message unicast sent ',data.toUser)
		console.log(data)

		var user = users.find(x=> x.username == data.toUser)
		console.log('usuario', user)
		if(user != undefined){
			console.log('valid user ')
			io.to(user.socketId).emit('private message',data);
			insertMessage(data);
		}else{
			// messages.push(data);
			// if the user isnt available insert message on db
			insertMessage(data);
		}
	});

	socket.on('message received',function( message ){
		console.log('message received',message)

		deleteMessage(message)

	})



	//send frend request to a specifc user
	socket.on('friend invitation',function(data){
		console.log('online: ',users)

		console.log('a user sent a friend invitation', data)


		pool.getConnection ( function(err,conn){
	        if (err) {
	          conn.release();
	          response.status = "CONNECTION ERROR"
	          res.json(response);
	          return;
	        }   

			query = "SELECT * from users where username = '"+ data.to + "'"
			conn.query(query, function(err, rows, fields) {

				if (!err){


					//console.log('The solution is: ', rows);
					var user = users.find(x=> x.username === data.to)
					console.log('usuario: ',user)

					if (user != undefined){
						//io.sockets.socket(user.socketId).emit('friend request',data);	
						console.log('user is not undefined')
						console.log(user.socketId)
						io.to(user.socketId).emit('friend request', data);				

						//io.emit('friend request',data)
					}
					else{

					}
				}
				 
				else{
					console.log('Error while performing Query.');
				}
			 
			});
		});


		//console.log(data.from)
		//console.log(data.to)

		//var user = users.find(x=> x.username === data.to)
		//if(user != undefined){
		//	io.sockets.socket(user.socketId).emit('friend request',data);	
		//}else{

			//store request to be send when the user is online
		//}

	});


	socket.on('acceptFriendRequest',function(request){
		var user = users.find(x=> x.username === request.from)
		if(user != undefined){
			io.to(user.socketId).emit('invitation accepted',request);	
		}
	})
	

});

http.listen(3030, function(){
	console.log('Disponível na porta :3030');
});
