const cluster = require('cluster');
const numCPUs = 20;
const express = require('express');
const bodyParser = require('body-parser');
const path = require(`path`);
const fs = require('fs')
const https = require('https');

const download = require("./download.js");

if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
    //console.log(`I am worker #${cluster.worker.id}`);

    const app = express();
    // [START enable_parser]
    app.use(bodyParser.urlencoded({ extended: true }));
    // [END enable_parser]

    app.get('/', (req, res) => {
        res.send('Hello from App Engine!');
      });
      
      // [START add_display_form]
      app.get('/submit', (req, res) => {
        res.sendFile(path.join(__dirname, '/views/form.html'));
      });
      // [END add_display_form]
      
      // [START add_post_handler]
    app.post('/submit', download.downloadMAC);

    // Listen to the App Engine-specified port, or 8080 otherwise
    const PORT = process.env.PORT || 8556;

    https.createServer({
      key: fs.readFileSync('openfinco2017.key'),
      cert: fs.readFileSync('openfinco2017.crt')
    }, app)
    .listen(PORT, () => {
        console.log(`I am worker #${cluster.worker.id}`);
    });
}