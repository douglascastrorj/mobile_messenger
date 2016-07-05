    // Ionic Starter App

    // angular.module is a global place for creating, registering and retrieving Angular modules
    // 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
    // the 2nd parameter is an array of 'requires'
    // 'starter.services' is found in services.js
    // 'starter.controllers' is found in controllers.js
    angular.module('starter', ['ionic','ngCordova' ,'starter.controllers', 'starter.services', 'ngSanitize','btford.socket-io'])

    .run(function($ionicPlatform) {
      $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }
      });
    })

    .config(function($stateProvider, $urlRouterProvider,$ionicConfigProvider) {

        // set tabs positon
        $ionicConfigProvider.tabs.position('bottom');

        // Ionic uses AngularUI Router which uses the concept of states
        // Learn more here: https://github.com/angular-ui/ui-router
        // Set up the various states which the app can be in.
        // Each state's controller can be found in controllers.js
        $stateProvider

        // setup an abstract state for the tabs directive
        .state('tab', {
            url: '/tab',
            abstract: true,
            templateUrl: 'templates/tabs.html',
            controller: 'MainCtrl'
        })

        // CONVERSAS
        .state('tab.conversas', {
            url: '/conversas',
            views: {
                'tab-conversas': {
                    templateUrl: 'templates/tab-conversas.html',
                    controller: 'ConversasCtrl'
                }
            },
            parent:'tab'
        })

        .state('tab.conversa', {
            url: '/conversas/:conversaID',
            views: {
                'tab-conversas': {
                    templateUrl: 'templates/conversa.html',
                    controller: 'ConversaCtrl'
                }
            },
            parent:'tab'
        })

        .state('tab.chat', {
            url: '/conversas/chat/:nickname',
            views: {
                'tab-conversas': {
                    templateUrl: 'templates/chat-detail.html',
                    controller: 'ChatController'
                }
            },
            parent:'tab'
        })

        // Contatos
        .state('tab.contatos', {
            url: '/contatos',
            views: {
                'tab-contatos': {
                    templateUrl: 'templates/tab-contatos.html',
                    controller: 'ContatosCtrl'
                    // controller: 'ConversasCtrl'
                },
                parent:'tab'
            }
        })

        .state('tab.friendProfile', {
            url: '/friendProfile/:who', //who's profile
            views: {
                'tab-contatos': {
                    templateUrl: 'templates/profile.html',
                    controller: 'ProfileCtrl'
                }
            }
        })

        .state('tab.profile', {
            url: '/profile/:who', //who's profile
            views: {
                'tab-account': {
                    templateUrl: 'templates/profile.html',
                    controller: 'ProfileCtrl'
                }
            }
        })

        .state('tab.account', {
            url: '/account',
            views: {
                'tab-account': {
                    templateUrl: 'templates/tab-account.html',
                    controller: 'AccountCtrl'
                }
            }
        })

        .state('tab.login', {
            url: '/login',
            views: {
                'tab-account': {
                    templateUrl: 'templates/login.html',
                    controller: 'AccountCtrl'
                }
            }
        });

      // if none of the above states are matched, use this as the fallback
      $urlRouterProvider.otherwise('/tab/conversas');

    });
