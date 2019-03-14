'use strict';

// [START app]
const express = require('express');
const bodyParser = require('body-parser');
const path = require(`path`);
const fs = require('fs')

const app = express();
var packager = require('mac-installer')

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
  console.log({
    name: req.body.name,
    message: req.body.message
  });
  packager({
  	flags:{
  		"c" : req.body.message,
  		"n" : req.body.name
  	}
  },function done (err) {
			if (err) console.log(err);
			else {
				res.writeHead(200, {
					"Content-Type": "application/octet-stream",
					"Content-Disposition": "attachment; filename=" + req.body.name + ".dmg"
				});
				fs.createReadStream(path.resolve(__dirname, (req.body.name + ".dmg"))).pipe(res);
			}
		}
	);
});
// [END add_post_handler]

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
// [END app]

module.exports = app;
