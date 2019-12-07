const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser,getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;
//Define path for Express Config
const publicDirectoryPath =  path.join(__dirname, '../public');

//Setup static directory serve
app.use(express.static(publicDirectoryPath));


//'connection' & 'disconnect' are default events
io.on('connection', (socket) => {

    //For specific room in chat-app
    socket.on('join', ( options, callback ) => {

        //id is the inherit id from Socket.io 'connection' => each connection has unique ID in Socket
        const { error, user } = addUser({ id: socket.id, ...options });

        if (error) {
            return callback(error);
        }

        //socket.join() only available in server side | socket.join() | io.to('...').emit() | socket.broadcast.to('...').emit()
        socket.join(user.room);


        socket.emit('welcomeMessage', generateMessage('Admin', `Welcome to Chat - ${user.username}`));
        socket.broadcast.to(user.room).emit('welcomeMessage', generateMessage('Admin', `${user.username} has joined!`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });

        callback();

    });

    //Checking Profanity of given Input message usign bad-words npm lib
    socket.on('sendInputMessage', (inputMessage, callback) => {

        const user = getUser(socket.id);

        if (!user) {
            callback({ error: 'No such user exists!'})
        }

        const filter = new Filter();

        if (filter.isProfane(inputMessage)){
            return callback('Profanity is not allowed.');
        }

        if (inputMessage) {
            io.to(user.room).emit('message', generateMessage(user.username, inputMessage));
        }

        callback();

    });

    //Receiving client's browser geo-coordinates and created location link in google maps and emit the location back to client
    socket.on('sendLocation', (locationCoords, callback) => {

        const user = getUser(socket.id);

        if (!user) {
            callback({ error: 'No such user exists!'})
        }

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, locationCoords));
        callback('Location shared!');

    });

    //Emit a event to client to notify about disconnected user
    socket.on('disconnect', () => {

        //id is the inherit id from Socket.io 'connection' => each connection has unique ID in Socket
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }

    });

});


server.listen(PORT, () => {

    console.log(`Server is listening to port ${PORT}`);

});
