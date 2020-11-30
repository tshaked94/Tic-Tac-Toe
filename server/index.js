const socketIO = require("socket.io");
const express = require("express");
const app = express();
const http = require("http");
const fileSystem = require("fs");
var Player = require('./Player');

const PORT = 8080;
const symbolX = "X";
const symbolO = "O";

const server = http.Server(app).listen(PORT, () => {
    console.log('listening on port ' + PORT)
});

const IO = socketIO(server);

app.use(express.static(__dirname + "/../client/"));
app.use(express.static(__dirname + "/../node_modules/"));

app.get("/", (req, res) => {
    const stream = fileSystem.createReadStream(__dirname + "/../client/index.html");
    stream.pipe(res);
});

const sockets = {};
var players = {};
var unmatched;

// On connection of player
IO.on("connection", function(socket) {
    console.log("Player #" + socket.id + " has connected");
    sockets[socket.id] = socket;

    socket.on("disconnect", () => {
        console.log("Player #" + socket.id + " has disconnected");
        delete sockets[socket.id];
        socket.broadcast.emit("playerdisconnected", socket.id);
    });

    join(socket);

    if (opponentOf(socket)) { // If the current player has an opponent the game can begin
        socket.emit("game.begin", { // Send the game.begin event to the player
            symbol: players[socket.id].symbol
        });

        opponentOf(socket).emit("game.begin", { // Send the game.begin event to the opponent
            symbol: players[opponentOf(socket).id].symbol 
        });
    }


    // Event for when any player makes a move
    socket.on("make.move", function(data) {
        if (!opponentOf(socket)) {
            // This shouldn't be possible since if a player doens't have an opponent the game board is disabled
            return;
        }

        // Validation of the moves can be done here

        socket.emit("move.made", data); // Emit for the player who made the move
        opponentOf(socket).emit("move.made", data); // Emit for the opponent
    });

    // Event to inform player that the opponent left
    socket.on("disconnect", function() {
        if (opponentOf(socket)) {
            opponentOf(socket).emit("opponent.left");
        }
    });
});


function join(socket) {
    players[socket.id] = new Player(unmatched, symbolX, socket);

    // If 'unmatched' is defined it contains the socket.id of the player who was waiting for an opponent
    // then, the current socket is player #2
    if (unmatched) { 
        players[socket.id].symbol = symbolO;
        players[unmatched].opponent = socket.id;
        unmatched = null;
    } else { //If 'unmatched' is not defined it means the player (current socket) is waiting for an opponent (player #1)
        unmatched = socket.id;
    }
}

function opponentOf(socket) {
    if (!players[socket.id].opponent) {
        return;
    }
    return players[players[socket.id].opponent].socket;
}