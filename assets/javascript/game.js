var player2 = null;
var player1 = null;
var playerCount = null;

var player1Name = "";
var player2Name = "";

var userName = "";

var player1Choice = "";
var player2Choice = "";

var turn = 0;

var p1Card = $("#player1-card");
var p2Card = $("#player2-card");

var config = {
    apiKey: "AIzaSyBr7hjW2ADXno4EpTNnyrMpAx-MkFClwEk",
    authDomain: "rps-multiplayer-3b622.firebaseapp.com",
    databaseURL: "https://rps-multiplayer-3b622.firebaseio.com",
    projectId: "rps-multiplayer-3b622",
    storageBucket: "rps-multiplayer-3b622.appspot.com",
    messagingSenderId: "73181491325"
};
firebase.initializeApp(config);

var database = firebase.database();

var playerData = database.ref("/playerData")
var playerCount = database.ref("playerCount");

var connectionsRef = database.ref("/connections");
var connectedRef = database.ref(".info/connected");

// client connection state change
connectedRef.on("value", function (snap) {
    if (snap.val()) {
        var con = connectionsRef.push(true);
        con.onDisconnect().remove();
    };
});

// LISTENER FOR DISCONNECTION EVENTS
database.ref("/playerData/").on("child_removed", function (snapshot) {
    var notify = snapshot.val().name + " has disconnected.";
    var chat = database.ref().child("/chat/").push().key;
    database.ref("/chat/" + chat).set(notify);
})


// SNAPSHOT OF THE LOCAL DATA AT PAGE LOAD AND OTHER VALUE CHANGES
database.ref("/playerData/").on("value", function (snapshot) {

    if (snapshot.child("player1").exists()) {
        console.log("Player 1 exists.");

        player1 = snapshot.val().player1;
        player1Name = player1.name;

        $("#player1-name").text(player1Name);
        $("#player1-results").text("Win: " + player1.wins);
    } else {
        console.log("Player 1: null.");

        player1 = null;
        player1Name = "";

        $("#player1-name").text("Waiting for Player 1...");
        $("#player1-results").text("Waiting for the Game to Start");

    };

    if (snapshot.child("player2").exists()) {
        console.log("Player 2 exists.");

        player2 = snapshot.val().player2;
        player2Name = player2.name;

        $("#player2-name").text(player2Name);
        $("#player2-results").text("Win: " + player2.wins);
    } else {
        console.log("Player 2: null.");

        player2 = null;
        player2Name = "";

        $("#player2-name").text("Waiting for Player 2...");
        $("#player2-results").text("Waiting for the Game to Start");
    };

    if (player1 && player2) {
        $("#lobby").hide();
        $("#show-game").show();
        // START 5 SECOND TIMER TO BEGIN GAME
        // TIMER WILL QUE A COMPARISON FUNCTION TO PLAY THE GAME
        // Allows for buttons to be dynamically created
    };

    if (!player1 && !player2) {
        console.log("a player disconnected");
    }

}, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
});

// LISTEN FOR NAME SUBMIT BUTTON
$("#add-player").on("click", function (event) {
    event.preventDefault();

    if (($("#tag-input").val().trim() !== "") && !(player1 && player2)) {
        if (player1 === null) {

            console.log("Initializing player 1");
            player1Name = $("#tag-input").val().trim();
            username = player1Name;

            player1 = {
                name: player1Name,
                wins: 0,
                loss: 0,
                tie: 0,
                choice: "",
                turn: 1
            };

            localStorage.clear();
            localStorage.setItem("username", username)
            database.ref().child("/playerData/player1").set(player1);
            database.ref("/playerData/player1").onDisconnect().remove();

        } else if (player1 !== null && player2 === null) {

            console.log("Initializing player 2");
            player2Name = $("#tag-input").val().trim();
            username = player2Name;

            player2 = {
                name: player2Name,
                wins: 0,
                loss: 0,
                tie: 0,
                choice: "",
                turn: 2
            };

            localStorage.clear();
            localStorage.setItem("username", username)
            database.ref().child("/playerData/player2").set(player2);
            database.ref("/playerData/player2").onDisconnect().remove();
        }

        $("#tag-input").val("");
    }
})

// ON CLICK EVENT LISTENER FOR PLAYER 1 CHOICE OF RPS
$("#player1-card").on("click", ".choose", function (event) {
    event.preventDefault();
    player1Choice = $(this).val().trim();

    console.log(player1Choice);
    database.ref().child("/playerData/player1/choice").set(player1Choice);
    p1Card.hide();

});

// ON CLICK EVENT LISTENER FOR PLAYER 2 CHOICE OF RPS
$("#player2-card").on("click", ".choose", function (event) {
    event.preventDefault();

    player2Choice = $(this).val().trim();

    console.log(player2Choice);
    database.ref().child("/playerData/player2/choice").set(player2Choice);
    p2Card.hide();

});

// COMPARE FUNCTION
function compare() {

    if (player1.choice !== "" || player2.choice !== "") {
        if (player1.choice === player2.choice) {

            console.log("Tie Game!");

            $("#winner-announce").text("Tie Game: No Winner");

            database.ref().child("/playerData/player1/tie").set(player1.tie + 1);
            database.ref().child("/playerData/player2/tie").set(player2.tie + 1);

        } else if (player1.choice === "r" && player2.choice === "p") {

            console.log("Player 1 Lost!");
            console.log("Player 2 Won!");

            $("#winner-announce").text("Player 2 Wins");

            database.ref().child("/playerData/player1/loss").set(player1.loss + 1);
            database.ref().child("/playerData/player2/wins").set(player2.wins + 1);

        } else if (player1.choice === "p" && player2.choice === "s") {

            console.log("Player 1 Lost!");
            console.log("Player 2 Won!");

            $("#winner-announce").text("Player 2 Wins");

            database.ref().child("/playerData/player1/loss").set(player1.loss + 1);
            database.ref().child("/playerData/player2/wins").set(player2.wins + 1);

        } else if (player1.choice === "s" && player2.choice === "r") {

            console.log("Player 1 Lost!")
            console.log("Player 2 Won!");

            $("#winner-announce").text("Player 2 Wins");

            database.ref().child("/playerData/player1/loss").set(player1.loss + 1);
            database.ref().child("/playerData/player2/wins").set(player2.wins + 1);

        } else if (player1.choice === "r" && player2.choice === "s") {

            console.log("Player 1 Won!")
            console.log("Player 2 Lost!");

            $("#winner-announce").text("Player 1 Wins");

            database.ref().child("/playerData/player1/wins").set(player1.wins + 1);
            database.ref().child("/playerData/player2/loss").set(player2.loss + 1);

        } else if (player1.choice === "p" && player2.choice === "r") {

            console.log("Player 1 Won!")
            console.log("Player 2 Lost!");

            $("#winner-announce").text("Player 1 Wins");

            database.ref().child("/playerData/player1/wins").set(player1.wins + 1);
            database.ref().child("/playerData/player2/loss").set(player2.loss + 1);

        } else if (player1.choice === "s" && player2.choice === "p") {

            console.log("Player 1 Won!")
            console.log("Player 2 Lost!");

            $("#winner-announce").text("Player 1 Wins");

            database.ref().child("/playerData/player1/wins").set(player1.wins + 1);
            database.ref().child("/playerData/player2/loss").set(player2.loss + 1);

        };
    } else {

        console.log("Both players need to choose")

    }
};