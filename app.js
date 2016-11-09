var express = require('express'),
    app = express(),
    server = require("http").createServer(app),
    fs = require("fs"),
    io = require("socket.io").listen(server, { log: false }),
    theport = process.env.PORT || 3000,
    Twitter = require("twitter"),
    request = require('request'),
    bodyParser = require('body-parser')
    sleep = require('sleep'),
    isEmptyArray = require('is-empty-array');

// listens to the port specified
server.listen(theport);
console.log("http server on port: " + theport);

app.use(express.static(__dirname + '/public'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/img', express.static(__dirname + '/img'));


var tw = new Twitter({
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
        access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
    }),
    stream = null,
    track = "clinton,trump",
    users = [];

/**
 * A listener for a client connection
 */
io.sockets.on("connection", function(socket) {
    if (users.indexOf(socket.id) === -1) {
        users.push(socket.id);
    }

    // Log
    logConnectedUsers();

    // Listener when a user emits the "start stream" signal
    socket.on("start stream", function() {
        // The stream will be started only when the 1st user arrives
        if (stream === null) {
            tw.stream("statuses/filter", {
                track: track
            }, function(s) {
                stream = s;
                var max = 100;
                stream.on("data", function(data) {
                    // only broadcast when users are online
                    if (users.length > 0) {

                        var tweetObj = {
                            color: "#FFFFFF",
                            lat: "",
                            lon: "",
                            size: 0,
                            text: "",
                            user: "",
                            data: data,
                            quote: {
                            	qouteText: "",
                        		qouteColor: ""
                        	},
                            error: {}
                        };

                        var text = "" + data.text;
                        //console.log(data);
                        //Set block size according to user's followers


                        //Decide color if the tweet is democratic or republic
                        var jsonString = JSON.stringify(data.text);
                        tweetObj.color = getTweetColor(jsonString.toLowerCase());

                        if(data.is_quote_status){
                        	var quote_text = data.quoted_status.text;
                        	var quote_color = getTweetColor(quote_text.toLowerCase());
                        	if(!tweetObj.color){tweetObj.color = quote_color;}
                    		tweetObj.quote.qouteText = quote_text;
                    		tweetObj.quote.qouteColor = getTweetColor(quote_text.toLowerCase());
                    		//console.log("quote : "+quote_color);

                        }

                        if (data.geo) {
                            tweetObj.lat = data.geo.coordinates[0];
                            tweetObj.lon = data.geo.coordinates[1];
                            if (data.user.followers_count > max)
                                max = data.user.followers_count;

                            tweetObj.size = 10 + 100 * (data.user.followers_count / max);
                            tweetObj.text = text;
                            tweetObj.user = data.user.screen_name;
                            socket.broadcast.emit("new tweet", tweetObj);
                            socket.emit("new tweet", tweetObj);
                        } else if (data.place !== undefined && data.place !== null) { //if no coordinate is provided use Google's Geocoding API
                            if (data.user.followers_count > max)
                                max = data.user.followers_count;

                            tweetObj.size = 10 + 100 * (data.user.followers_count / max);
                            tweetObj.text = text;
                            tweetObj.user = data.user.screen_name;


                            var params = {
                                'access_token': process.env.MAPBOX_ACCESS_TOKEN,
                                'limit': 1
                            };
                            var options = {
                                url: 'https://api.mapbox.com/geocoding/v5/mapbox.places/'+data.place.full_name+'.json',
                                qs: params
                            };
                            request.get(options, function(error, response, body) {
                                if (error)
                                    console.log(error);
                                else {
                                    var obj = JSON.parse(response.body);
                                    if (!isEmptyArray(obj.features)) {
                                        tweetObj.lat = obj.features[0].center[1];
                                        tweetObj.lon = obj.features[0].center[0];
                                        socket.broadcast.emit("new tweet", tweetObj);
                                        socket.emit("new tweet", tweetObj);
                                    } else {
                                        tweetObj.error = JSON.parse(response.body);
                                        socket.broadcast.emit("new tweet", tweetObj);
                                        socket.emit("new tweet", tweetObj);
                                    }
                                }
                            });
                            sleep.usleep(100000);
                        }

                    } else {
                        // If there are no users connected we destroy the stream.
                        console.log("destroying stream");
                        stream.destroy();
                        stream = null;
                    }
                });
                stream.on('error', function(error) {
                    //console.log("ERROR");
                    //console.log(error);
                });

                stream.on('end', function(response) {
                    console.log("Twitter stream end");
                });

                stream.on('destroy', function(response) {
                    console.log("Twitter stream destroy");
                });
                stream.on('disconnect', function(response) {
                    console.log("Twitter stream disconnect" + response.disconnect);
                });
            });


        }
    });

    // This handles when a user is disconnected
    socket.on("disconnect", function(o) {
        // find the user in the array
        var index = users.indexOf(socket.id);
        if (index != -1) {
            // Eliminates the user from the array
            users.splice(index, 1);
        }
        logConnectedUsers();
    });

    // Emits signal when the user is connected sending
    // the tracking words the app it's using
    socket.emit("connected", {
        tracking: track
    });
});

function getTweetColor(s){
	if ((s.indexOf("trump") !== -1 || s.indexOf("donald") !== -1) && (s.indexOf("clinton") !== -1 || s.indexOf("hillary") !== -1)) {
        return "#FFFFFF";
    } else if (s.indexOf("trump") !== -1 || s.indexOf("donald") !== -1) {
        return "#E91D0E";
    } else if (s.indexOf("clinton") !== -1 || s.indexOf("hillary") !== -1) {
        return "#00a9e0";
    } else{
    	return false;
    }
}

function logConnectedUsers() {
    console.log("Users connected: " + users.length);
}
