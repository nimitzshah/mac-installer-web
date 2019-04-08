const cluster = require('cluster');
const numCPUs = 50;

const express = require('express');
const bodyParser = require('body-parser');
const path = require(`path`);
const fs = require('fs')

var packager = require('mac-installer')

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
    app.post('/submit', (req, res) => {
        console.log(`worker #${cluster.worker.id} deal with:`);
        console.log({
            name: req.body.name,
            message: req.body.message
        });
        packager({
            flags:{
                "c" : req.body.message,
                "n" : req.body.name,
                "f" : cluster.worker.id.toString()
            }
        },function done (err) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log(`worker #${cluster.worker.id} Successfully create dmg file!`);
                    res.writeHead(200, {
                        "Content-Type": "application/octet-stream",
                        "Content-Disposition": "attachment; filename=" + req.body.name + ".dmg"
                    });
                    fs.createReadStream(path.resolve(__dirname, cluster.worker.id.toString(), (req.body.name + ".dmg"))).pipe(res);
                }
            }
        );
    });

    // Listen to the App Engine-specified port, or 8080 otherwise
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
        console.log(`I am worker #${cluster.worker.id}`);
    });
}