# 2016 Election Visualizer

![2016ElectionVisualizer](http://i.giphy.com/dkzqLQMDGEzks.gif)

Realtime visualization of people tweeting about Donald Trump and/or Hillary Clinton around the world. The line height is proportional to the tweeting user's followers, and hence the tweet's reach.

I use Twitter's Streaming API to get a stream of tweets matching the filters, use Google Map's Geocoding API if the coordinates aren't provided, and then use Socket.IO to send the data from the Node.JS server to the client web app running WebGL Globe.

####Technologies Used:

  - Node.JS
  - Socket.IO
  - jQuery
  - Twitter Streaming API
  - Google Maps Geocoding API


### Credits

This couldn't have been possible without:

  - [WebGL Globe](https://github.com/dataarts/webgl-globe) by Google Data Arts Team 
  - [Realtime WebGL Globe](https://github.com/askmike/realtime-webgl-globe) - realtime implementation of WebGL Globe


### Version
1.0.0

### Installation
After adding Twitter API keys and Google Maps Geocoding API key to environment variables, run:

```sh
$ npm install
$ npm start
```

License
----

MIT
