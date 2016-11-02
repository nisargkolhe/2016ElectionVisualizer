var _socket = null;
$(function() {
    var div = document.getElementById('globe');
    var urls = {
        earth: 'img/world.jpg',
        bump: 'img/bump.jpg',
        specular: 'img/specular.jpg',
    }

    // create a globe
    var globe = new Globe(div, urls);

    // start it
    globe.init();

    var data = {
        color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        size: Math.random() * 100,
        lat: Math.random() * 160 - 80,
        lon: Math.random() * 360 - 180,
    };



    if (io !== undefined) {
        _socket = io.connect("http://electionvisualizer.herokuapp.com/");

        // This will listen to the "new tweet" signal everytime
        // there's a new tweet incoming into the stream
        _socket.on("new tweet", function(tweet) {
            console.log(tweet);
            $('.tweets').html('<p>"' + tweet.text + '" <i>~@' + tweet.user + '<i></p>');
            $('.tweets').css('border-left-color', tweet.color);
            globe.center(tweet);
            globe.addLevitatingBlock(tweet);

        });

        // This will listen when the server emits the "connected" signal
        // informing to the client that the connection has been stablished
        _socket.on("connected", function(r) {
            $("head").find("title").html("Tracking now: " + r.tracking);
            $(".tracking").html(r.tracking);

            // Here the client tells the server to "start stream"
            emitMsj("start stream");
        });
    }
});

function emitMsj(signal, o) {
    if (_socket) {
        _socket.emit(signal, o);
    } else {
        alert("Shit! Socket.io didn't start!");
    }
}
