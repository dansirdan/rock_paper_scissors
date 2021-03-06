$(document).ready(function () {

    // GLOBAL VARIABLES
    var player1 = null;
    var player2 = null;
    var player1Name = "";
    var player2Name = "";
    var username = "";
    var player1Choice = "";
    var player2Choice = "";
    var compare1 = false;
    var compare2 = false;

    // DYNAMICALLY SHOWING/HIDING CONTENT
    var p1Card = $("#player1-card");
    var p2Card = $("#player2-card");
    var player1BTNs = $("#p1BTN");
    var player2BTNs = $("#p2BTN");
    var lobbyScreen = $("#screen-lobby");
    var gameScreen = $("#screen-game");
    var messageScreen = $("#screen-message");
    var createPlayer = $("#create-player");

    // LOADS PAGE WITH JUST THE LOBBY CARD SHOWING
    lobbyScreen.show();
    gameScreen.hide();
    messageScreen.hide();

    // FIREBASE CONFIG AND INITIALIZATION
    var config = {
        apiKey: "AIzaSyBr7hjW2ADXno4EpTNnyrMpAx-MkFClwEk",
        authDomain: "rps-multiplayer-3b622.firebaseapp.com",
        databaseURL: "https://rps-multiplayer-3b622.firebaseio.com",
        projectId: "rps-multiplayer-3b622",
        storageBucket: "rps-multiplayer-3b622.appspot.com",
        messagingSenderId: "73181491325"
    };
    firebase.initializeApp(config);

    // DATABASE VARIABLES
    var database = firebase.database();
    var playerData = database.ref("/playerData")
    var connectionsRef = database.ref("/connections");
    var connectedRef = database.ref(".info/connected");

    // LISTENER FOR CLIENT CONNECTION CHANGES
    connectedRef.on("value", function (snap) {
        if (snap.val()) {
            var con = connectionsRef.push(true);
            con.onDisconnect().remove();
        };
    });

    // LISTENER FOR DISCONNECTION EVENTS
    database.ref("/playerData/").on("child_removed", function (snapshot) {
        var notify = snapshot.val().name + " has disconnected.";
        var msg = $("<div>").text(notify);

        var chat = database.ref().child("/chat/").push().key;
        database.ref("/chat/" + chat).set(notify);
        $("#chat-box").append(msg);

    });

    // CHAT LISTENER SNAPSHOT
    database.ref("/chat/").on("child_added", function (snapshot) {
        var msg = snapshot.val();
        var msgEntry = $("<div>").html(msg);

        if (msg.startsWith(username)) {
            msgEntry.addClass("msgBlue");
        } else {
            msgEntry.addClass("msgGreen");
        }

        $("#chat-box").append(msgEntry);
        $("#chat-box").scrollTop($("#chat-box")[0].scrollHeight);

    });

    database.ref("/endRound/").on("value", function (snapshot) {

        if (snapshot.child("first").exists()) {
            compare1 = snapshot.val().first;
        } else {
            console.log("compare1 null")
        };

        if (snapshot.child("second").exists()) {
            compare2 = snapshot.val().second;
        } else {
            console.log("compare2 null")
        };

        if (compare1 === true && compare2 === true) {
            lobbyScreen.show();
            createPlayer.hide();
            gameScreen.hide();
            messageScreen.hide();
            setTimeout(compare(), 3000);
        } else {
            console.log("waiting to choose");
        };
    });

    // SNAPSHOT OF THE LOCAL DATA AT PAGE LOAD AND OTHER VALUE CHANGES
    database.ref("/playerData/").on("value", function (snapshot) {

        if (snapshot.child("player1").exists()) {
            console.log("Player 1 exists.");

            player1 = snapshot.val().player1;
            player1Name = player1.name;

            $("#player1-name").text("player_one: " + player1Name);
            $("#player1-results").text("Wins: " + player1.wins + " Losses: " + player1.loss + " Ties: " + player1.tie);
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

            $("#player2-name").text("player_two: " + player2Name);
            $("#player2-results").text("Wins: " + player2.wins + " Losses: " + player2.loss + " Ties: " + player2.tie);
        } else {
            console.log("Player 2: null.");

            player2 = null;
            player2Name = "";

            $("#player2-name").text("Waiting for Player 2...");
            $("#player2-results").text("Waiting for the Game to Start");
        };

        if (!player1 && !player2) {
            database.ref("/chat/").remove();
        }

    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });

    // LISTENER FOR SUBMIT NEW PLAYER BUTTON
    $("#add-player").on("click", function (event) {
        event.preventDefault();

        // If the input is empty and both players do not exist, intialize player 1
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
                    ready: false,
                };

                // SAVES THE username TO THE LOCALSTORAGE IN ORDER TO COMPARE LATER
                localStorage.clear();
                localStorage.setItem("username", username);
                database.ref().child("/endRound/first").set(false);
                database.ref().child("/playerData/player1").set(player1);
                database.ref("/playerData/player1").onDisconnect().remove();

                // HUGE!!!! THIS WILL ONLY CHANGE THE DOM ON PLAYER1'S SCREEN HAHA
                lobbyScreen.hide();
                gameScreen.show();
                p2Card.hide();
                messageScreen.show();
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
                    ready: false
                };

                localStorage.clear();
                localStorage.setItem("username", username);
                database.ref().child("/endRound/second").set(false);
                database.ref().child("/playerData/player2").set(player2);
                database.ref("/playerData/player2").onDisconnect().remove();

                // HUGE!!!! THIS WILL ONLY CHANGE THE DOM ON PLAYER1'S SCREEN HAHA
                lobbyScreen.hide();
                gameScreen.show();
                p1Card.hide();
                messageScreen.show();
            }

            var msg = (username + " has arrived.");
            var msgKey = database.ref().child("/chat/").push().key;
            database.ref("/chat/" + msgKey).set(msg);

            // CLEARS THE INPUT FIELD
            $("#tag-input").val("");
        };
    });

    // ON CLICK EVENT LISTENER FOR PLAYER 1 CHOICE OF RPS
    $("#player1-card").on("click", ".choose", function (event) {
        event.preventDefault();

        // GRAB THE LOCALSTORAGE username
        var player1Check = localStorage.getItem("username");

        // COMPARE IT TO PLAYER1.NAME
        // ALLOWS ONLY PLAYER1 TO CLICK ON PLAYER1 BUTTONS! CONSOLE.LOG'S "Nice try cheater..." IF THEY TRY TO CLICK THEIR BUTTONS
        // SEMI FLAWED IF THE USER HAS THE SAME USER NAME AS THE OTHER PLAYER
        if ((player1 && player2) && player1Check === player1.name) {

            player1Choice = $(this).val().trim();
            player1BTNs.hide();
            player1Ready = true;
            $("#player1-gif").attr("src", "assets/images/waiting.gif");
            $("#player-announce").text("...waiting for player 2...");
            database.ref().child("/playerData/player1/choice").set(player1Choice);
            database.ref().child("/playerData/player1/ready").set(player1Ready);
            database.ref().child("/endRound/first").set(true);
        };
    });

    // ON CLICK EVENT LISTENER FOR PLAYER 2 CHOICE OF RPS
    $("#player2-card").on("click", ".choose", function (event) {
        event.preventDefault();

        // GRAB THE LOCALSTORAGE username
        var player2Check = localStorage.getItem("username");

        // COMPARE IT TO PLAYER2.NAME
        // ALLOWS ONLY PLAYER1 TO CLICK ON PLAYER2 BUTTONS! CONSOLE.LOG'S "Nice try cheater..." IF THEY TRY TO CLICK THEIR BUTTONS
        // SEMI FLAWED IF THE USER HAS THE SAME USER NAME AS THE OTHER PLAYER
        if ((player1 && player2) && player2Check === player2.name) {

            player2Choice = $(this).val().trim();
            player2BTNs.hide();
            player2Ready = true;
            $("#player2-gif").attr("src", "assets/images/waiting.gif");
            database.ref().child("/playerData/player2/ready").set(player2Ready);
            $("#player-announce").text("...waiting for player 1...");
            database.ref().child("/playerData/player2/choice").set(player2Choice);
            database.ref().child("/endRound/second").set(true);
        };
    });

    // LISTENER FOR CHAT SUBMIT BUTTON
    $("#send-msg").on("click", function (event) {
        event.preventDefault();

        // This checks to see if the person submitting a message has a username or not
        if (username !== "") {
            var msg = username + ": " + $("#msg-input").val().trim();
            $("#msg-input").val("");
            var msgKey = database.ref().child("/chat/").push().key;

            database.ref("/chat/" + msgKey).set(msg);

        };
    });

    // COMPARE FUNCTION
    function compare() {

        if (player1.choice !== "" && player2.choice !== "") {

            lobbyScreen.hide();
            createPlayer.show();
            gameScreen.show();
            messageScreen.show();

            if (player1.choice === player2.choice) {

                console.log("Tie Game!");

                $("#winner-announce").text("Tie Game: No Winner");
                $("#gif-image").attr("src", "assets/images/tiegame.gif");

                database.ref().child("/playerData/player1/tie").set(player1.tie + 1);
                database.ref().child("/playerData/player2/tie").set(player2.tie + 1);
                setTimeout(newRound(), 3000);

            } else if (player1.choice === "r" && player2.choice === "p") {

                console.log("Player 1 Lost!");
                console.log("Player 2 Won!");

                $("#winner-announce").text("Player 2 Wins");
                $("#gif-image").attr("src", "assets/images/paper.gif");

                database.ref().child("/playerData/player1/loss").set(player1.loss + 1);
                database.ref().child("/playerData/player2/wins").set(player2.wins + 1);
                setTimeout(newRound(), 3000);

            } else if (player1.choice === "p" && player2.choice === "s") {

                console.log("Player 1 Lost!");
                console.log("Player 2 Won!");

                $("#winner-announce").text("Player 2 Wins");
                $("#gif-image").attr("src", "assets/images/scissor.gif");

                database.ref().child("/playerData/player1/loss").set(player1.loss + 1);
                database.ref().child("/playerData/player2/wins").set(player2.wins + 1);
                setTimeout(newRound(), 3000);

            } else if (player1.choice === "s" && player2.choice === "r") {

                console.log("Player 1 Lost!")
                console.log("Player 2 Won!");

                $("#winner-announce").text("Player 2 Wins");
                $("#gif-image").attr("src", "assets/images/rock.gif");

                database.ref().child("/playerData/player1/loss").set(player1.loss + 1);
                database.ref().child("/playerData/player2/wins").set(player2.wins + 1);
                setTimeout(newRound(), 3000);

            } else if (player1.choice === "r" && player2.choice === "s") {

                console.log("Player 1 Won!")
                console.log("Player 2 Lost!");

                $("#winner-announce").text("Player 1 Wins");
                $("#gif-image").attr("src", "assets/images/rock.gif");

                database.ref().child("/playerData/player1/wins").set(player1.wins + 1);
                database.ref().child("/playerData/player2/loss").set(player2.loss + 1);
                setTimeout(newRound(), 3000);

            } else if (player1.choice === "p" && player2.choice === "r") {

                console.log("Player 1 Won!")
                console.log("Player 2 Lost!");

                $("#winner-announce").text("Player 1 Wins");
                $("#gif-image").attr("src", "assets/images/paper.gif");

                database.ref().child("/playerData/player1/wins").set(player1.wins + 1);
                database.ref().child("/playerData/player2/loss").set(player2.loss + 1);
                setTimeout(newRound(), 3000);

            } else if (player1.choice === "s" && player2.choice === "p") {

                console.log("Player 1 Won!")
                console.log("Player 2 Lost!");

                $("#winner-announce").text("Player 1 Wins");
                $("#gif-image").attr("src", "assets/images/scissor.gif");

                database.ref().child("/playerData/player1/wins").set(player1.wins + 1);
                database.ref().child("/playerData/player2/loss").set(player2.loss + 1);
                setTimeout(newRound(), 3000);

            };
        } else {
            console.log("compare function not ready");
        };
    };

    // GAME RESET BUTTON TO BE ON A TIMER INSIDE OF COMPARE
    function newRound() {
        database.ref().child("/playerData/player1/choice").set("");
        database.ref().child("/playerData/player2/choice").set("");
        database.ref().child("/endRound/first").set(false);
        database.ref().child("/endRound/second").set(false);
        $("#player-announce").empty();
        $("#player1-gif").attr("src", "");
        $("#player2-gif").attr("src", "");
        player1BTNs.show();
        player2BTNs.show();
        player1Ready = false;
        player2Ready = false;
        database.ref().child("/playerData/player1/ready").set(player1Ready);
        database.ref().child("/playerData/player2/ready").set(player2Ready);
    };
});