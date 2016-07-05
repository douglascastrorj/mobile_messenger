angular.module('starter.services', [])


.directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind("keydown keypress", function(event) {
            if(event.which === 13) {
                scope.$apply(function(){
                        scope.$eval(attrs.ngEnter);
                });
                
                event.preventDefault();
            }
        });
    };
})

.factory('Friend',function(){
    return {id:"", name:"", img:"", email:"" }
})


.factory('socket',function(socketFactory){
    //Create socket and connect to http://chat.socket.io 
    var nodeServer = 'http://192.168.254.17:3030'
    // var serverChat = 'http://chat.socket.io'
    var myIoSocket = io.connect(nodeServer);

    mySocket = socketFactory({
      ioSocket: myIoSocket
    });
    
    return mySocket;
})

.factory('Conversas', function(DB) {


  // Might use a resource here that returns a JSON array
 
    var conversas = [ 
        // {
        //     id: 2,
        //     name: 'Max',
        //     lastText: 'Ele disse que a saliva do deputado era fedida.',
        //     messages: [],
        //     img: 'img/max.png'
        // }, {
        //     id: 3,
        //     name: 'rootOld',
        //     lastText: '',
        //     messages: [],
        //     img: 'img/mike.png'
        // }, {
        //     id: 4,
        //     name: 'Perry',
        //     lastText: '"Pelos moradores de rua que vivem na rua, pela chassina de 1900 e bolinha..."',
        //     messages: [],
        //     img: 'img/perry.png'   
        // }
    ];

    var refreshConversas = function(){
        DB.getFriends().success(function(data) {
        // console.log('Contatos in main ctrl: ',$scope.contatos)
            conversas = data
        }).error(function(data) {
                    
        });     
    }
    

  return {
    all: function() {
        refreshConversas();
        return conversas;
    },

    remove: function(conversa) {
      conversas.splice(conversas.indexOf(conversa), 1);
      DB.deleteConversa(conversa);
    },

    get: function(conversaID) {

        for (var i = 0; i < conversas.length; i++) {
            console.log('metodo get',conversa[i])
            if (conversas[i].id == parseInt(conversaID)) {
                return conversas[i];
            }
        }
        return null;
    },
    // data = { from: user , to: $scope.conversa.name, conversaName: user,content : $scope.message }
    append: function(data){
        DB.addConversa(data.fromUser, "img/user.png");
        DB.addMessage(data);
    },
    create : function(contato){

        //save on data base
        // console.log('nome da conversa a ser criada',contato.name)
        if(contato.img ==  '' || contato.img == undefined)
            contato.img = "img/user.png";
        DB.addConversa(contato.name, contato.img);
    }

  };
})

.service('DB',function  ($q) {

    var megabyte = 1024*1024
    var db = window.openDatabase("chat", "1.0", "chat", 100 * megabyte);

    var SQL_CREATE_MESSAGES_TABLE  = 'CREATE TABLE IF NOT EXISTS messages  (id INTEGER PRIMARY KEY, content VARCHAR, conversaName VARCHAR, fromUser VARCHAR, toUser VARCHAR, sendDate DATETIME);';
    var SQL_CREATE_CONVERSAS_TABLE = 'CREATE TABLE IF NOT EXISTS conversas (id INTEGER PRIMARY KEY, name VARCHAR unique, lastText VARCHAR, img VARCHAR);';
    var SQL_CREATE_FRIENDS_TABLE   = 'CREATE TABLE IF NOT EXISTS friends   (id INTEGER PRIMARY KEY, name VARCHAR unique, displayName VARCHAR, email VARCHAR, img VARCHAR);';
    var SQL_CREATE_USERS =           'CREATE TABLE IF NOT EXISTS users     (id INTEGER PRIMARY KEY, name VARCHAR unique, displayName VARCHAR, email VARCHAR, profilePicture VARCHAR, birthDate DATETIME, comment TEXT);';

    return {

       



        initDB : function(){
            
            db.transaction(function (tx) {

                tx.executeSql('DROP TABLE users');
                tx.executeSql(SQL_CREATE_USERS,[],null,function(t,err){
                    console.log(err)
                });
                console.log('table users has been created');


                tx.executeSql('DROP TABLE friends');
                tx.executeSql(SQL_CREATE_FRIENDS_TABLE);
                console.log('table friends has been created');


                tx.executeSql('DROP TABLE conversas');
                tx.executeSql(SQL_CREATE_CONVERSAS_TABLE);
                console.log('table conversas has been created');

                tx.executeSql('DROP TABLE messages');
                tx.executeSql(SQL_CREATE_MESSAGES_TABLE);
                console.log('table messages has been created') ;    

            });

        },

        //user = {name, email, profilePicture, birthDate, comment}
        addUser: function(user){
            db.transaction(function (tx) {
                tx.executeSql(SQL_CREATE_USERS);
                tx.executeSql('INSERT INTO users ( name, displayName, email, profilePicture, birthDate, comment) VALUES (?,?,?,?,?,?)',[user.name,user.name, user.email, user.profilePicture, new Date(user.birthDate), user.comment ],null,function(t,err){
                    console.log(err)
                });
            })
        },
        //user = {name, email, profilePicture, birthDate, comment}
        updateUser: function(user){
            db.transaction(function (tx) {
                tx.executeSql(SQL_CREATE_USERS);
                var query = 'UPDATE users set displayName = "'+ user.displayName +'", email = "'+ user.email + '", profilePicture = "'+user.profilePicture +'", birthDate ="'+user.birthDate +'", comment ="'+ user.comment + '" WHERE name = "' + user.name + '";';
                console.log(query)
                tx.executeSql(query,[],null,function(t,err){
                    console.log(err)
                });
            })
        },
        getUserByName : function(name){

            var deferred = $q.defer();
            var promise = deferred.promise;
 
              
            db.transaction(function (tx) {
                tx.executeSql('SELECT * FROM users where name = "'+ name+ '"', [], function (tx, results) {
                    
                    var user = results.rows.item(0)
                    
                   
                    deferred.resolve(user)

                    console.log('results on DB ',user)
                    // return contatos;

                }, null);
            });

            promise.success = function(fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function(fn) {
                promise.then(null, fn);
                return promise;
            }
            
            return promise
        },


        //friends functions
        getFriends : function(){

            var deferred = $q.defer();
            var promise = deferred.promise;
 
              
            db.transaction(function (tx) {
                tx.executeSql('SELECT * FROM friends', [], function (tx, results) {
                    var len = results.rows.length, i;
                    var contatos = []
                    for (i = 0; i < len; i++){
                        console.log(results.rows.item(i).name );
                        contatos.push(results.rows.item(i));
                    }

                   
                    deferred.resolve(contatos)

                    console.log('results on DB ',contatos)
                    // return contatos;

                }, null);
            });

            promise.success = function(fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function(fn) {
                promise.then(null, fn);
                return promise;
            }
            
            return promise
        },
        getFriendByName : function(name){

            var deferred = $q.defer();
            var promise = deferred.promise;
 
              
            db.transaction(function (tx) {
                tx.executeSql('SELECT * FROM friends where name = "'+ name+ '";', [], function (tx, results) {
                    
                    var user = results.rows.item(0)
                    
                   
                    deferred.resolve(user)

                    console.log('results on DB ',user)
                    // return contatos;

                }, function(t,err){
                    console.log(err)
                });
            });

            promise.success = function(fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function(fn) {
                promise.then(null, fn);
                return promise;
            }
            
            return promise
        },

        addFriend : function(friend){
            db.transaction(function (tx) {
                tx.executeSql(SQL_CREATE_FRIENDS_TABLE);

                tx.executeSql('INSERT INTO friends ( name, displayName, email, img) VALUES (?,?,?,?)',[friend.name,friend.name, friend.email, friend.img ],null,function(t,err){
                    console.log(err)
                });
                // console.log('stored in database...\nselect * from friends...')
                // tx.executeSql('SELECT * FROM friends', [], function (tx, results) {
                //     var len = results.rows.length, i;
                //     for (i = 0; i < len; i++){
                //         console.log(results.rows.item(i).name );
                //     }

                // }, null);
            });
        },
        updateFriend : function(friendProfile){
            db.transaction(function (tx) {
                tx.executeSql(SQL_CREATE_FRIENDS_TABLE);
                var query = 'UPDATE friends set displayName = "'+ friendProfile.displayName +'", email = "'+ friendProfile.email + '", img = "'+friendProfile.profilePicture + '" WHERE name = "' + friendProfile.name + '";';
                console.log(query)
                tx.executeSql(query,[],null,function(t,err){
                    console.log(err)
                });
            })
        },
        deleteFriend : function(friend){
            db.transaction(function (tx) {
                var query = "delete from friends where id = '"+friend.id+"'; "
                tx.executeSql(query);

                console.log('friend removed')
               
            });
        },

        //conversa functions

        getConversa : function(conversaId){
            var deferred = $q.defer();
            var promise = deferred.promise;
 
              
            db.transaction(function (tx) {
                var query = 'SELECT * FROM conversas where id = (?)';
                tx.executeSql(query, [ conversaId ], function (tx, results) {
                    var len = results.rows.length, i;
                    var conversa;
                    
                    conversa = results.rows.item(0);
                   
                    deferred.resolve(conversa);
                    // return contatos;

                }, null);
            });

            promise.success = function(fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function(fn) {
                promise.then(null, fn);
                return promise;
            }
            
            return promise
        },

        getConversas : function( user ){
            var deferred = $q.defer();
            var promise = deferred.promise;
 
              
            db.transaction(function (tx) {
                tx.executeSql('SELECT * FROM conversas', [], function (tx, results) {
                    console.log('get conversas works')
                    var len = results.rows.length, i;
                    var conversas = []
                    for (i = 0; i < len; i++){
                        console.log(results.rows.item(i).name );
                        conversas.push(results.rows.item(i));
                    }

                   
                    deferred.resolve(conversas)

                    console.log('results on DB ',conversas)
                    // return contatos;

                }, function(transaction,err){console.log(err)});
            });

            promise.success = function(fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function(fn) {
                promise.then(null, fn);
                return promise;
            }
            
            return promise
        },
        addConversa : function(name,img){
            var successHandler = function(){}
            var errorHandler1 = function(transaction,err){console.log('create table',err)}

            db.transaction(function (tx) {
                tx.executeSql(SQL_CREATE_CONVERSAS_TABLE,[],successHandler,errorHandler1);

                tx.executeSql('INSERT INTO conversas ( name, img, lastText) VALUES (?,?,?)',[name,img, "" ],successHandler,errorHandler1);

                console.log('stored in database...\nselect * from conversas...')
                tx.executeSql('SELECT * FROM conversas', [], function (tx, results) {
                    var len = results.rows.length, i;
                    for (i = 0; i < len; i++){
                        console.log('conversa ',i,results.rows.item(i).name );
                    }

                }, null);
            });
        },
        updateConversa : function(){

        },
        deleteConversa : function(conversa){
            db.transaction(function (tx) {
                var query = 'delete from conversas where id = "'+  conversa.id +'";';
                tx.executeSql(query);

                query = 'delete from messages where conversaName ="'+conversa.name+'";';
                tx.executeSql(query);
            });
            
        },
        getMessages: function(conversaName, user, n_messages){
            var deferred = $q.defer();
            var promise = deferred.promise;
 

              
            db.transaction(function (tx) {
                var successHandler = function(){}
                var errorHandler1 = function(transaction,err){console.log('select messages',err)}

                var query = 'SELECT * FROM (SELECT * FROM messages where conversaName = "'+conversaName+'" and ( toUser = "'+user+'" or fromUser = "'+user+'" ) ORDER BY id DESC  limit '+ n_messages +') ORDER BY id ASC';

                // console.log(query)
                // tx.executeSql(query,[],successHandler,errorHandler1)
                tx.executeSql(query, [], function (tx, results) {

                    var len = results.rows.length, i;
                    var messages = []
                    console.log('messages found',len)
                    for (i = 0; i < len; i++){
                        messages.push(results.rows.item(i));
                        // console.log(results.rows.item(i));
                    }

                   
                    deferred.resolve(messages);

                }, null);
            });

            promise.success = function(fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function(fn) {
                promise.then(null, fn);
                return promise;
            }
            
            return promise
        },
        loadMoreMessagesFrom: function(message ,user, n_messages){
            var deferred = $q.defer();
            var promise = deferred.promise;
 

              
            db.transaction(function (tx) {
                var successHandler = function(){}
                var errorHandler1 = function(transaction,err){console.log('select messages',err)}

                var query = 'SELECT * FROM messages where conversaName = "'+message.conversaName+'" and ( toUser = "'+user+'" or fromUser = "'+user+'" ) and id < "'+ message.id+'" ORDER BY id DESC  limit '+ n_messages +';';

                // console.log(query)
                // tx.executeSql(query,[],successHandler,errorHandler1)
                tx.executeSql(query, [], function (tx, results) {

                    var len = results.rows.length, i;
                    var messages = []
                    console.log('messages found',len)
                    for (i = 0; i < len; i++){
                        messages.push(results.rows.item(i));
                        // console.log(results.rows.item(i));
                    }

                   
                    deferred.resolve(messages);

                }, null);
            });

            promise.success = function(fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function(fn) {
                promise.then(null, fn);
                return promise;
            }
            
            return promise
        },
        addMessage : function(message){
            var successHandler = function(){}
            var errorHandler1 = function(transaction,err){console.log('create table',err)}
            var errorHandler2 = function(transaction,err){console.log('insert ',err)}
            db.transaction(function (tx) {
               tx.executeSql(SQL_CREATE_MESSAGES_TABLE,[], successHandler, errorHandler1);
               var query = 'INSERT INTO messages (conversaName, content, fromUser, toUser, sendDate) VALUES ("'+message.conversaName+'" , "'+message.content+'" , "'+message.fromUser+'","'+message.toUser+'","'+ new Date() +'")';
               tx.executeSql(query,[], successHandler, errorHandler2);

               //update conversa lasttext
               query = 'update conversas set lastText = "'+message.content+'"   where name = "'+message.conversaName+'";'
               tx.executeSql(query,[], successHandler, errorHandler2);

            });
        },
        deleteMessage: function(message){
            db.transaction(function (tx) {
                var query = 'delete from messages where id = "'+  message.id +'";';
                tx.executeSql(query);
               
            });
            
        }



    }


})

.service('ContatoService',function  (socket,DB) {

    /**/
  var contatos = [ 
  // {
  //   id: 0,
  //   name: 'Game Of Thrones',
  //   img: 'img/grupo_got.jpg'
  // }, {
  //   id: 1,
  //   name: 'Adam Smith',
  //   img: 'img/adam.jpg'
  // }, {
  //   id: 2,
  //   name: 'Max Steel',
  //   img: 'img/max.png'
  // },
  // {
  //   id: 3,
  //   name: 'Mike',
  //   img: 'img/mike.png'
  // },
  // {
  //   id: 2,
  //   name: 'Perry o Ornitorrinco',
  //   img: 'img/perry.png'
  // } 
  ];

  return {
    all: function(){

        // var contatos = undefined

        // DB.getFriends().success(function(data) {
        //     console.log('service DB ',data)
        //     contatos =  data
        // }).error(function(data) {
        //     console.log(data);
        //     contatos =  []
            
        // });

        
        return contatos;


        // return contatos;
      //localStorage.getItem("friends");
    },
    add:function(username,email){
        friend = { name : username , email : email, img : 'img/user.png'}
        contatos.push(friend)
        DB.addFriend(friend)
        return
    },

    get:function(email){
      return
    },
    remove: function(email){
      return
    },

    sendFriendRequest : function(request){
        socket.emit('friend invitation', request); 
    }


  }

})

.service ('getIp',function($q,$http){
    return {

        ip : function(){
            var json = 'http://ipv4.myexternalip.com/json';
            var deferred = $q.defer();
            var promise = deferred.promise;



            $http.get(json).success(function(data) {
                //console.log(data);
                deferred.resolve(data.ip);               
            })
            .error(function(dataerr) {
               deferred.reject('Wrong credentials.');
            });

            promise.success = function(fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function(fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;  

        }    
    }
})

.service('LoginService', function($q,$http,socket) {
    var loginPage = "http://192.168.254.17/chat/users/login.php";
    var nodeLoginPage = "http://192.168.254.17:3030/login";

    var logoutPage = "http://192.168.254.17/chat/users/logout.php";
    var nodeLogoutPage = "http://192.168.254.17:3030/logout";

    var signUpPage = "http://192.168.254.17/chat/users/cadastro.php";
    var nodeSignUpPage = "http://192.168.254.17:3030/signUp";
    return {
        signUp: function(user,pass,email){

            var deferred = $q.defer();
            var promise = deferred.promise;

            var wasLoginPerformed = false;
           
            $http.post(signUpPage, {username : user, password : pass, useremail : email }).then(function (res){

                var response = res.data;
                console.log(response);
                if(response.valid){
                    

                    deferred.resolve(response);
                    
                } else {
                    deferred.reject(response);
                }          
                
            });

            promise.success = function(fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function(fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;      

        },

        loginUser: function(name, pw) {
            var deferred = $q.defer();
            var promise = deferred.promise;
 
            if (name == 'Douglas' && pw == '123') {
                deferred.resolve('Welcome ' + name + '!');
                localStorage.setItem("user", name);
                localStorage.setItem("password", pw);
            } else {
                deferred.reject('Wrong credentials.');
            }
            promise.success = function(fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function(fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;            
        },

        loginOnServer: function(user,pass,ip){

            var deferred = $q.defer();
            var promise = deferred.promise;

            var wasLoginPerformed = false;
           
            $http.post(loginPage, {username : user, password : pass , userIp : ip}).then(function (res){

                var response = res.data;
                
                if(response.valid){

                    deferred.resolve('Welcome ' + user + '!');
                    localStorage.setItem("user", user);
                    localStorage.setItem("password", pass);        
                } else {
                    deferred.reject('Wrong credentials.');
                }          
                
            });

            promise.success = function(fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function(fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;      

        },
        logOff: function(){
            
            var deferred = $q.defer();
            var promise = deferred.promise;

            var wasLoginPerformed = false;
           
            $http.post(logoutPage, {username : localStorage.getItem("user") }).then(function (res){

                var response = res.data;
                
                if(response.valid){

                    deferred.resolve('logout performed');
                    localStorage.setItem("user", "");
                    localStorage.setItem("password", "");        
                } else {
                    deferred.reject('Wrong credentials.');
                }          
                
            });

            promise.success = function(fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function(fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;      
        },

        // NODE JS SERVER
        signUpOnNodeServer: function(user, email, pass){

            var deferred = $q.defer();
            var promise = deferred.promise;

            var wasLoginPerformed = false;
           
            $http.post(nodeSignUpPage, {username : user, email : email, password : pass }).then(function (res){
                console.log(user)

                
                var response = res.data
                console.log(response)
                if(response.valid){
                    deferred.resolve('Welcome ' + user + '!');
                    localStorage.setItem("user", user);
                    localStorage.setItem("password", pass);
                    socket.emit('add user', localStorage.getItem('user') );
                } else {
                    deferred.reject('Wrong credentials.');
                }          
                
            });

            promise.success = function(fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function(fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;      

        },

        loginOnNodeServer: function(user,pass){

            var deferred = $q.defer();
            var promise = deferred.promise;

            var wasLoginPerformed = false;
           
            $http.post(nodeLoginPage, {username : user, password : pass }).then(function (res){
                console.log(user)

                
                var response = res.data
                console.log(response)
                if(response.valid){
                    deferred.resolve('Welcome ' + user + '!');
                    localStorage.setItem("user", user);
                    localStorage.setItem("password", pass);
                    socket.emit('add user', localStorage.getItem('user') );
                } else {
                    deferred.reject('Wrong credentials.');
                }          
                
            });

            promise.success = function(fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function(fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;      

        },

        logOffOnNodeServer: function(){
            
            var deferred = $q.defer();
            var promise = deferred.promise;

            var wasLoginPerformed = false;
           
            $http.post(nodeLogoutPage, {username : localStorage.getItem("user"), password : localStorage.getItem("password") }).then(function (res){

                var response = res.data;
                
                if(response.valid){

                    deferred.resolve('logout performed');
                    localStorage.setItem("user", "");
                    localStorage.setItem("password", "");        
                } else {
                    deferred.reject('Wrong credentials.');
                }          
                
            });

            promise.success = function(fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function(fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;      
        }
        
    }
});
