const url = window.location.origin;
let socket = io.connect(url);

var myTurn = true;
var symbol;

const XWon = "XXX";
const OWon = "OOO";

function getBoard() {
  var obj = {};
  $(".board button").each(function() {
      obj[$(this).attr("id")] = $(this).text() || "";
  });

  return obj;
}

function isGameOver() {
    var state = getBoard();
    var winningConditions = [XWon, OWon];

    var rows = [
      state.r0c0 + state.r0c1 + state.r0c2, // 1st line
      state.r1c0 + state.r1c1 + state.r1c2, // 2nd line
      state.r2c0 + state.r2c1 + state.r2c2, // 3rd line
      state.r0c0 + state.r1c0 + state.r2c0, // 1st column
      state.r0c1 + state.r1c1 + state.r2c1, // 2nd column
      state.r0c2 + state.r1c2 + state.r2c2, // 3rd column
      state.r0c0 + state.r1c1 + state.r2c2, // 1st diagonal
      state.r0c2 + state.r1c1 + state.r2c0  // 2nd diagonal
    ];

    for (var i = 0; i < rows.length; i++) {
        if (rows[i] === winningConditions[0] || rows[i] === winningConditions[1]) {
            return true;
        }
    }

    return false;
}

function isBoardFull() {
    var state = getBoard();
    for (const [key, value] of Object.entries(state)) {
        if (!value) {
            return false;
        }
    }
    return true;
}

function renderTurnMessage() {
    if (!myTurn) { // Disable the board if its not my turn
        $("#message").text("Your opponent's turn");
        $(".board button").attr("disabled", true);
    } else {
        $("#message").text("Your turn.");
        $(".board button").removeAttr("disabled");
    }
}

function makeMove(e) {
    if (!myTurn) {
        return;
    }

    if ($(this).text().length) {
        return;
    }

    socket.emit("make.move", { // Valid move (on client side) -> emit to server
        symbol: symbol,
        position: $(this).attr("id")
    });
}

// Bind event on players move
socket.on("move.made", function(data) {
    $("#" + data.position).text(data.symbol);

    myTurn = data.symbol !== symbol;
    var gameOver = isGameOver();
    if (!gameOver && !isBoardFull()) {
        renderTurnMessage();
    } else {
        if(gameOver) {
            if (myTurn) {
                $("#message").text("You lost.");
            } else {
                $("#message").text("You won!");
            }
        } else {
            $("#message").text("Its a draw");
        }
        $(".board button").attr("disabled", true);
    }
});


// Bind event for game begin
socket.on("game.begin", function(data) {
    symbol = data.symbol;
    myTurn = symbol === "X";
    renderTurnMessage();
});

socket.on("opponent.left", function() {
    $("#message").text("Your opponent left the game.");
    $(".board button").attr("disabled", true);
});

$(function() {
  $(".board button").attr("disabled", true);
  $(".board> button").on("click", makeMove);
});