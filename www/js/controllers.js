angular.module('starter.controllers', [])


    // socket listening
    .controller('MainCtrl', function($scope, $ionicScrollDelegate, ContatoService, Conversas, socket, DB) {


        $scope.isUserOnline = function() {
            return (localStorage.getItem("user") != '' && localStorage.getItem("user") != undefined)
        }

        $scope.getFriends = function() {

            DB.getFriends().then(function(data) {
                // console.log('Contatos in main ctrl: ',$scope.contatos)
                $scope.contatos = data
            })
        }

        $scope.findConversaInCache = function(name) {
            if ($scope.conversas != undefined)
                return $scope.conversas.find(conversa => conversa.name == name)
            
            return null;
        }

        $scope.getConversas = function() {

            DB.getConversas(localStorage.getItem('user')).then(function(data) {
                $scope.conversas = data
            })
        }
        
        $scope.refreshConversas = function() {
            $scope.getConversas();
        }


        if ($scope.isUserOnline()) {
            console.log('main controller', localStorage.getItem('user'))

            socket.on('connect', function() {
                socket.emit('add user', localStorage.getItem('user'));
            })
        }


        /*               CONTATOS                   */
        /**********************************************************************/


        //$scope.contatos = ContatoService.all();

        // $scope.contatos = []
        $scope.getFriends();
        $scope.requests = []

        socket.on('friend request', function(data) {

            console.log(data)
            if ($scope.isUserOnline) {
                //Set the value of connected flag
                console.log(data.from, ' has sent u a friend request')

                if (!(data in $scope.requests)) {
                    $scope.requests.push(data)
                }
            }

        });

        socket.on('invitation accepted', function(request) {

            if ($scope.isUserOnline()) {
                console.log('the invitation sent was accepted')

                ContatoService.add(request.to, "email")
                $scope.getFriends()
            }
        })


        /*                             CONVERSAS                             */
        /*********************************************************************/

        // $scope.conversas = Conversas.all();
        $scope.getConversas();

        // data = { user : user, message : message }
        // data = { from: user , to: $scope.conversa.name, conversaName: user,content : $scope.message }
        socket.on('private message', function(data) {

            if ($scope.isUserOnline()) {
                console.log('message received from ', data.fromUser, data.content)
                Conversas.append(data)
                $scope.refreshConversas();

                socket.emit('message received', data);
              // $ionicScrollDelegate.scrollBottom();
            }
        })

        socket.on('are you there?', function() {
            var user = localStorage.getItem('user')
            console.log('yes i am ', user)
            if ($scope.isUserOnline()) {
                socket.emit('yes i am', user)
            }
        })

  })



    .controller('ContatosCtrl', function($scope, $ionicModal, $ionicPopup, $ionicPopover, $state, $location, ContatoService, socket, Conversas, DB) {




        $scope.showOptions = function(contato) {
            console.log('show popup!!')
            var alertPopup = $ionicPopup.alert({
                title: '<b class="dark"> Contato: ' + contato.nome + '</b>',
                buttons: [{
                    text: ' <i class="ion-person"> Perfil </i>  ',
                    type: 'button-clear button-positive ',

                    onTap: function(e) {
                        showPerfil(contato)
                    }

                }, {
                    text: '<i class=" ion-chatboxes "> Conversa </i>',
                    type: 'button-clear button-positive',

                    onTap: function(e) {
                        conversa(contato)
                    }

                }]
            });
        }


        var showPerfil = function(contato) {
            $state.go('tab.friendProfile', {
                who: contato.name
            })
        }

        var conversa = function(contato) {

            var conversaId;

            var conversa = $scope.findConversaInCache(contato.name) //find a conversation from cache with name contato.name
            if (conversa != null) {
                conversaId = conversa.id;
                $location.path('tab/conversas/' + conversaId);
            } else {
                Conversas.create(contato); // create a conversation to friend contato

                $scope.refreshConversas();

                $location.path('tab/conversas');
            }

            // $location.path('tab/conversas/'+conversaId);
        }

        $scope.remove = function(contato) {
            DB.deleteFriend(contato);
            $scope.getFriends()
        }

        var removeRequest = function(request) {
            for (var n = 0; n < $scope.requests.length; n++) {
                if ($scope.requests[n].from == request.from) {
                    var removedObject = $scope.requests.splice(n, 1);
                    removedObject = null;
                    break;
                }
            }
        }

        var pushContact = function(request) {
            if ($scope.contatos == undefined) {
                console.log('contatos is undefined')
                $scope.contatos = []
            }

            ContatoService.add(request.from, "email")

            // $scope.contatos = ContatoService.all();
            $scope.getFriends()
        }

        $scope.acceptFriendRequest = function(request) {

            if ($scope.isUserOnline()) {
                socket.emit('acceptFriendRequest', request)

                pushContact(request)
                removeRequest(request)
            }
        }

        $scope.rejectFriendRequest = function(request) {
            removeRequest(request)
        }


        $scope.createContact = function(newUser) {

            if ($scope.isUserOnline()) {
                var nome = "";
                if (newUser.firstName != "" && newUser.firstName != undefined) {
                    nome = nome + newUser.firstName;
                };
                if (newUser.lastName != "" && newUser.lastName != undefined) {
                    nome = nome + newUser.lastName;
                };
                if (nome != "") {

                    //if(nome != localStorage.getItem("user")){
                    ContatoService.sendFriendRequest({
                        from: localStorage.getItem("user"),
                        to: nome
                    })
                    // socket.emit('friend invitation', {from: localStorage.getItem("user"), to : nome}); 
                    //}

                    newUser.firstName = ""
                    newUser.lastName = ""
                    newUser.email = ""
                };
                $scope.closeModal();
                // $scope.modal.hide();    
            }
        }

        $ionicModal.fromTemplateUrl('templates/add-contato.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.modal = modal;
        });


        $scope.openModal = function() {
            $scope.modal.show();
        };


        $scope.closeModal = function() {
            $scope.modal.hide();
        };


        // Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function() {
            $scope.modal.remove();
        });


        // Execute action on hide modal
        $scope.$on('modal.hidden', function() {
            // Execute action

        });


        // Execute action on remove modal
        $scope.$on('modal.removed', function() {
            // Execute action
        });


  })




    .controller('ConversaCtrl', function($scope, $stateParams, $ionicScrollDelegate, $timeout, Conversas, socket, DB) {

        $scope.classes = {
            chat_left: "chat-bubble left",
            chat_right: "chat-bubble right"
        }
        $scope.holded = false;

        $scope.user = localStorage.getItem("user");
        $scope.conversa_name = "Carregando...";


        var conversaID = $stateParams.conversaID;
        console.log('conversa id', conversaID)
        // $scope.messages = $stateParams.messages;
        // console.log('messages ConversaCtrl',$scope.messages[0])

        DB.getConversa($stateParams.conversaID).success(function(conversa) {
            $scope.conversa = conversa;
            $scope.conversa_name = conversa.name;

            console.log('ConversaCtrl:', $scope.conversa);

            getMessages();
        }).error(function(data) {

        });

        var getMessages = function() {
            DB.getMessages($scope.conversa.name, $scope.user, 10).success(function(messages) {
                $scope.messages = messages;
                console.log('messages found', messages)
                $ionicScrollDelegate.scrollBottom();
            }).error(function(data) {
                console.log(data)
            });
        }



        $scope.onHoldMessage = function(message) {
            console.log('message holded', message.id)

            if (message.class == "bubble-selected") {
                message.class = ""
            } else message.class = "bubble-selected"

            console.log(message.class)
        }


        var elViewport = document.querySelector('#list');



        $scope.hasMoreItemsAvailable = true;
        $scope.loadMore = function() {

            var old = elViewport.scrollHeight;
            var new_ = -1

            if ($scope.messages != undefined) {
                console.log('loading more messages')
                console.log($scope.messages[0].offsetTop)


                DB.loadMoreMessagesFrom($scope.messages[0], $scope.user, 10).success(function(messages) {
                    // $scope.messages = messages
                    for (var i = 0; i < messages.length; i++) {
                        $scope.messages.unshift(messages[i])
                    }

                    console.log('messages loaded', messages)

                }).error(function(data) {
                    console.log(data)
                });
            }
            setTimeout(function() {
                new_ = elViewport.scrollHeight;
                console.log('new', new_)
                var top = new_ - old
                console.log('dist', top)

                var shouldAnimate = false
                $ionicScrollDelegate.scrollTo(0, top, shouldAnimate);
            }, 100)
        }

        $scope.DateFormat = function(date) {

            var newDate = new Date(date)
            var dateStr = ('0' + newDate.getDate()).slice(-2) + '/' + ('0' + (newDate.getMonth() + 1)).slice(-2) + '/' + newDate.getFullYear() + '  -  ' + newDate.getHours() + ':' + ('0' + newDate.getMinutes()).slice(-2);
            return dateStr
        }

        $scope.sendMessage = function() {

            // $scope.conversa_name = $scope.conversa.name;
            var date = new Date();

            var message = {
                fromUser: $scope.user,
                toUser: $scope.conversa.name,
                conversaName: $scope.user,
                content: $scope.message,
                sendDate: date
            }

            if (message.content == 'image') {
                socket.emit('send image')
                return
            }

            console.log(message)
            socket.emit('message to', message)

            message.conversaName = $scope.conversa.name;

            //Conversas.append( message );
            DB.addMessage(message);
            console.log('message', message)
            console.log('message', $scope.messages[0])
            $scope.messages.push(message);
            $ionicScrollDelegate.scrollBottom();

            //$scope.conversa = Conversas.get($stateParams.conversaID);

            //addMessageToList($stateParams.nickname,true,$scope.message)
            // socket.emit('stop typing');
            $scope.message = ""
        }


        socket.on('private message', function(data) {
            // console.log('message received from ',data.from,data.content)
            if (data.conversaName == $scope.conversa.name) {
                $scope.messages.push(data);
                $ionicScrollDelegate.scrollBottom();
            }
        })

        socket.on("image", function(info) {
            console.log('image received')
            console.log(info.buffer)
            var ctx = document.getElementById('canvas').getContext('2d');

            if (info.image) {
                var img = new Image();
                img.src = 'data:image/jpeg;base64,' + info.buffer;
                ctx.drawImage(img, 0, 0);
            }
        });

        // Updates the typing event
        // function sendUpdateTyping(){
        //   if(connected){
        //  if (!typing) {
        //    typing = true;
        //    socket.emit('typing');
        //  }
        //   }
        //   lastTypingTime = (new Date()).getTime();
        //   $timeout(function () {
        //    var typingTimer = (new Date()).getTime();
        //    var timeDiff = typingTimer - lastTypingTime;
        //    if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
        //    socket.emit('stop typing');
        //    typing = false;
        //    }
        //  }, TYPING_TIMER_LENGTH)
        // }
        // //function called on Input Change
        // $scope.updateTyping=function(){
        //   sendUpdateTyping()
        // }

        // Display message by adding it to the message list
        // function addMessageToList(username,style_type,message){
        //   username = $sanitize(username)
        //   removeChatTyping(username)
        //   var color = style_type ? getUsernameColor(username) : null
        //   $scope.messages.push({content:$sanitize(message),style:style_type,username:username,color:color})
        //   $ionicScrollDelegate.scrollBottom();
        //   var date = new Date();
        //   $scope.date = ('0' + date.getDate()).slice(-2) + '/' + ('0' + (date.getMonth() + 1)).slice(-2) + '/' + date.getFullYear() + '  -  ' +  date.getHours() + ':' + ('0' +date.getMinutes()).slice(-2) ;
        // }
    })




    .controller('ConversasCtrl', function($scope, $http, Conversas, $state, $sanitize, $ionicPopup, socket, DB) {



        // With the new view caching in Ionic, Controllers are only called
        // when they are recreated or on app start, instead of every page change.
        // To listen for when this page is active (for example, to refresh data),
        // listen for the $ionicView.enter event:
        //
        //$scope.$on('$ionicView.enter', function(e) {
        //});

        var server = 'http://jsonplaceholder.typicode.com/posts';
        $scope.posts = []

        $scope.getData = function() {
            return $http({
                method: 'GET',
                url: server
            }).success(function(data) {
                $scope.posts = data;
            });
        }

        //$scope.getData();



        $scope.user = localStorage.getItem("user");

        $scope.conversar = function(conversa) {

            console.log('Conversar em: ', conversa)
            $state.go('tab.conversa', {
                conversa: conversa
            });
        }


        $scope.goChat = function() {

            var alertPopup = $ionicPopup.alert({
                title: 'Usuário não conectado',
                template: 'Para utilizar o serviço de chat é preciso estar conectado.'
            });

        }


        $scope.remove = function(conversa) {
            Conversas.remove(conversa);
            $scope.refreshConversas();
        };
    })
      
    .controller('ProfileCtrl', function($scope, $cordovaImagePicker, $ionicPlatform, $state, $stateParams, DB) {

        var who = $stateParams.who;

        $scope.userProfile = {
            name: '',
            displayName: '',
            email: '',
            profilePicture: '',
            birthDate: null,
            comment: ''
        }

        if ($scope.isUserOnline()) {
            if (who == 'user') {
                console.log('who =', who)
                DB.getUserByName(localStorage.getItem("user")).then(function(data) {
                    $scope.userProfile = data
                })
            } else {
                //load friend
                DB.getFriendByName(who).then(function(data) {
                    console.log(data)
                    $scope.userProfile.name = data.name
                    $scope.userProfile.displayName = data.name
                    $scope.userProfile.email = data.email
                    $scope.userProfile.profilePicture = data.img
                    $scope.userProfile.birthDate = ''
                    $scope.userProfile.comment = 'Eu dou dinheiro pra minha filha. Eu dou dinheiro pra ela viajar, então é... é... Já vivi muito sem dinheiro, já vivi muito com dinheiro. -Jornalista: Coloca esse dinheiro na poupança que a senhora ganha R$10 mil por mês. -Dilma: O que que é R$10 mil?'
                })
            }

        } else {
            //leave page
            $state.go('tab.login');
        }

        $scope.save = function() {
            console.log(who)
            if (who == 'user') {
                DB.updateUser($scope.userProfile)
            } else {
                //update friend
                DB.updateFriend($scope.userProfile)
                $scope.getFriends()
                $state.go('tab.contatos');
            }


        }

        $scope.cancel = function(){
            if(who == 'user')
                $state.go('tab.account')
            else
                $state.go('tab.contatos');
        }

        $scope.collection = {
            selectedImage: ''
        };

        $ionicPlatform.ready(function() {

            $scope.getImageSaveContact = function() {
                // Image picker will load images according to these settings
                var options = {
                   maximumImagesCount: 1, // Max number of selected images, I'm using only one for this example
                   width: 800,
                   height: 800,
                   quality: 80 // Higher is better
                };

                $cordovaImagePicker.getPictures(options).then(function(results) {
                      // Loop through acquired images
                    for (var i = 0; i < results.length; i++) {
                       $scope.collection.selectedImage = results[i]; // We loading only one image so we can use it like this
                       $scope.userProfile.profilePicture = results[i];
                        window.plugins.Base64.encodeFile($scope.collection.selectedImage, function(base64) { // Encode URI to Base64 needed for contacts plugin
                            $scope.collection.selectedImage = base64;
                            // console.log(base64)
                             $scope.userProfile.comment =  base64
                            //$scope.addContact();    // Save contact
                        });
                    }
                }, function(error) {
                    console.log('Error: ' + JSON.stringify(error)); // In case of error
                });
            };
        });
    })

    .controller('ChatController', function($scope, $state, $stateParams, socket, $sanitize, $ionicScrollDelegate, $timeout) {

        $scope.exit = function() {
            $state.go('tab.conversas');
        }

        var typing = false;
        var lastTypingTime;
        var TYPING_TIMER_LENGTH = 400;

        //Add colors
        var COLORS = [
            '#e21400', '#91580f', '#f8a700', '#f78b00',
            '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
            '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
        ];

        //initializing messages array
        $scope.messages = []

        //socket.on('connect',function(){

        console.log("connected!!");

        connected = true

        //Add user
        socket.emit('add user', $stateParams.nickname);

        // On login display welcome message
        socket.on('login', function(data) {
            //Set the value of connected flag
            $scope.connected = true
            $scope.number_message = message_string(data.numUsers)

        });

        // Whenever the server emits 'new message', update the chat body
        socket.on('new message', function(data) {
            if (data.message && data.username) {
                addMessageToList(data.username, true, data.message)
                console.log(data.message);
            }
        });

        // Whenever the server emits 'user joined', log it in the chat body
        socket.on('user joined', function(data) {
            addMessageToList("", false, data.username + " joined")
                //addMessageToList("",false,message_string(data.numUsers)) 
        });

        // Whenever the server emits 'user left', log it in the chat body
        socket.on('user left', function(data) {
          addMessageToList("", false, data.username + " left")
              // addMessageToList("",false,message_string(data.numUsers))
        });

        //Whenever the server emits 'typing', show the typing message
        socket.on('typing', function(data) {
          //addChatTyping(data);
        });

        // Whenever the server emits 'stop typing', kill the typing message
        socket.on('stop typing', function(data) {
          removeChatTyping(data.username);
        });
        //})

        //function called when user hits the send button
        $scope.sendMessage = function() {
            socket.emit('new message', $scope.message)
            addMessageToList($stateParams.nickname, true, $scope.message)
            socket.emit('stop typing');
            $scope.message = ""
        }

        //function called on Input Change
        $scope.updateTyping = function() {
            sendUpdateTyping()
        }

        // Display message by adding it to the message list
        function addMessageToList(username, style_type, message) {
            username = $sanitize(username)
            removeChatTyping(username)
            var color = style_type ? getUsernameColor(username) : null
            $scope.messages.push({
                content: $sanitize(message),
                style: style_type,
                username: username,
                color: color
            })
            $ionicScrollDelegate.scrollBottom();
            var date = new Date();
            $scope.date = ('0' + date.getDate()).slice(-2) + '/' + ('0' + (date.getMonth() + 1)).slice(-2) + '/' + date.getFullYear() + '  -  ' + date.getHours() + ':' + ('0' + date.getMinutes()).slice(-2);
        }

        //Generate color for the same user.
        function getUsernameColor(username) {
            // Compute hash code
            var hash = 7;
            for (var i = 0; i < username.length; i++) {
                hash = username.charCodeAt(i) + (hash << 5) - hash;
            }
            // Calculate color
            var index = Math.abs(hash % COLORS.length);
            return COLORS[index];
        }

        // Updates the typing event
        function sendUpdateTyping() {
            if (connected) {
                if (!typing) {
                    typing = true;
                    socket.emit('typing');
                }
            }
            lastTypingTime = (new Date()).getTime();
            $timeout(function() {
                var typingTimer = (new Date()).getTime();
              var timeDiff = typingTimer - lastTypingTime;
              if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                  socket.emit('stop typing');
                  typing = false;
              }
          }, TYPING_TIMER_LENGTH)
        }

        // Adds the visual chat typing message
        function addChatTyping(data) {
            addMessageToList(data.username, true, " is typing");
        }

        // Removes the visual chat typing message
        function removeChatTyping(username) {
            $scope.messages = $scope.messages.filter(function(element) {
                return element.username != username || element.content != " is typing"
            })
        }

        // Return message string depending on the number of users
        function message_string(number_of_users) {
            return number_of_users === 1 ? "there's 1 participant" : "there are " + number_of_users + " participants"
        }
    })




    .controller('AccountCtrl', function($scope, $ionicLoading, LoginService, $ionicPopup, $state, $http, getIp, DB) {

        $scope.user = localStorage.getItem("user");
        $scope.isOnline = false;

        $scope.settings = {
            manterDados: false,
            somenteWifi: true,
            ativarNotificacoes: true
        };

        $scope.data = {};
        $scope.goProfile = function() {
            $state.go('tab.profile', {
                who: 'user'
            })
        }


        $scope.signUp = function() {


        console.log('controller: ' + $scope.data.username + ' ' + $scope.data.password + ' ' + $scope.data.email)
        if ($scope.data.username != undefined && $scope.data.password != undefined && $scope.data.email != undefined && $scope.data.username != '' && $scope.data.password != '' && $scope.data.email != '') {
            LoginService.signUpOnNodeServer($scope.data.username, $scope.data.email, $scope.data.password).success(function(data) {

                var user = {
                  name: $scope.data.username,
                  displayName: $scope.data.username,
                  email: $scope.data.email,
                  profilePicture: 'img/user.png',
                  birthDate: new Date(),
                  comment: 'Digite aqui alguma coisa sobre voce'
                }
                
                DB.addUser(user)
                
                var alertPopup = $ionicPopup.alert({
                  title: 'Usuário Cadastrado com Sucesso',
                  template: data.status
                });

            }).error(function(data) {
              console.log(data);
              var alertPopup = $ionicPopup.alert({
                  title: 'Falha no Cadastro',
                  template: data.status
              });
            });
        }
        else {
            var alertPopup = $ionicPopup.alert({
              title: '<p class="assertive">Por favor preencha todos os campos</p>',
              buttons: [{
                  text: '<b>Ok</b>',
                  type: 'button-assertive',
                  onTap: function(e) {

                  }
              }]
            });
        }
    }



    $scope.login = function() {

      // getIp.ip().success(function(ip){     

      // }).error(function(ip){
      //  return "error";
      // });
        LoginService.loginOnNodeServer($scope.data.username, $scope.data.password).success(function(data) {
          $scope.isOnline = true;
          var user = {
              name: $scope.data.username,
              displayName: $scope.data.username,
              email: $scope.data.email,
              profilePicture: 'img/user.png',
              birthDate: new Date(),
              comment: 'Digite aqui alguma coisa sobre voce'
          }
          DB.addUser(user)
          $state.go('tab.conversas');
        }).error(function(data) {
          console.log(data);
          var alertPopup = $ionicPopup.alert({
              title: '<p class="assertive"> Falha no Login</p>',
              template: 'Verifique se o nome de usuário e a senha estão corretos.',
              buttons: [{
                  text: '<b>Ok</b>',
                  type: 'button-assertive',
                  onTap: function(e) {

                  }
              }]
          });
        });
    }


    $scope.logout = function() {
        LoginService.logOffOnNodeServer();
        // localStorage.setItem("user", "");
        //localStorage.setItem("password", "");
        $scope.user = '';
    }

    $scope.getIp = function() {
        var data = getIp.ip().success(function(data) {
          console.log('IP: ' + data);
          return data;
        }).error(function(data) {
          return "error";
        });
    }


    $scope.initDB = function() {
        DB.initDB();
    }



    $scope.testNodeServer = function() {
        $http.post('http://localhost:3030/login', {
          username: "douglas",
          password: "123",
          email: "douglascastrorj@gmail.com"
        }).then(function(res) {

          var response = res.data;
          console.log(response);

        });
    }

});