(function(io) {
  'use strict';

  angular.module('jabber')

  .factory('chatService', ['socket', function(socket) {
    function ChatService() {
      var self = this,
          subscriptions = {
            all: []
          },
          contacts = [],
          activeChatIds = [],
          activeInformationCallbacks = [];

      socket.on('your-contacts', function(contacts, chatIds) {
        contacts = contacts;
        activeChatIds = chatIds;

        _.forEach(activeInformationCallbacks, function(callback) {
          callback({contacts: contacts, chats: activeChatIds});
        });
      });


      self.subscribeToActiveInformation = function(callback) {
        callback({contacts: contacts, chats: activeChatIds});
        activeInformationCallbacks.push(callback);
      };

      /*
      * sends chat to the server
      *
      * expects
      * id: chat of id
      * message: message to be sent
      */
      self.sendChat = function(id, message) {
        socket.emit('message-from-user', message);
      };

      /*
      * register a callback to be called when a message
      * is recieved from the server
      *
      * expects
      * callback: the function to be called when the
      *           chatID recieves a new message
      * OPTIONAL
      * chatID: the chatID to subscribe to, if blank subscribes
      *         to all messages
      */
      self.subcribeToMessages = function(callback, id) {
        if (id === undefined) {
          subscriptions.all.push(callback);
        } else {
          if (subscriptions[id] === undefined) {
            subscriptions[id] = [];
          }

          subscriptions[id].push(callback);
        }
      };

      /*
      * deregister a callback to from being called when a message
      * is recieved from the server
      *
      * expects
      * callback: the function that was registered
      *
      * chatID: the chatID to unsubscribe from
      */
      self.deregisterFromMessages = function(callback, id) {
        if (subscriptions[id] !== undefined) {
          _.forEach(subscriptions[id], function(item, i) {
            if (item === callback) {
              subscriptions[id].splice(i, 1);
            }
            return true;
          });
        }
      };

      /*
      * Add a contact to your list.
      * 
      * expects
      * id: id of the user to add
      */
      self.addContact = function(id) {
        socket.emit('add-contact', id);
      };

      /*
      * handler for recieving a new message
      * send to all watchers
      */
      socket.on('message-to-user', function(message) {
        if (!(message.id !== undefined && subscriptions[message.id] !== undefined)) {
          return;
        }
        
        _.forEach(subscriptions[message.id], function(callback) {
          callback(message);
        });

        _.forEach(subscriptions.all, function(callback) {
          callback(message);
        });
      });

      //TODO REMOVE
      // for development purposes to delete entire database.
      self.gitResetHard = function() {
        socket.emit('gitResetHard');
      };

      return self;
    }

    return new ChatService();
  }]);
})(io);