const fse = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
var request = require('request');
var packager = require('../mac-installer')
const cluster = require('cluster');

function downloadMAC(req, res) {
  console.log(`worker #${cluster.worker.id} deal with:`);
  var download = {}; //HACK
  download.outputFile = req.body.name;
  download.config = req.body.message;
  download.id = crypto.randomBytes(4).toString("hex");
  download.time = new Date();
  download._folder = path.join('public', download.id);
  download._fileName = (download.outputFile || "openfin-installer") + ".dmg";
  download._path = path.join(download._folder, download._fileName);

    serviceInfo = "download_service_mac";

    console.log('steps define');

  // End of chain and error catch
  produceMacFile(download)
    .then(() => {
      console.log(`worker #${cluster.worker.id} Successfully create dmg file!`);
      return new Promise(resolve => {
        res.download(download._path, err => {
          if (err) {
            console.log(err);
            res.status(err.status).end();
          }
          resolve();
        });
      });
    })
    .catch(err => {
        console.log(err);
      res
        .status(500)
        .send("Something went wrong. Please contact support@openfin.co");
    })
    .then(() => {
      // Cleanup
      fse.remove(download._folder, err => {
        if (err) {
            console.log(err);
            console.log('err delete');
        }
      });
    });
}

//=====================================================================
// Call Mac Installer Service
//=====================================================================
function produceMacFile(download) {
  console.log('inside produceMacFile');
  return new Promise((resolve, reject) => {
   packager({
      flags:{
          "c" : download.config,
          "n" : download.outputFile,
          "f" : download._folder
      }
    },function done (err) {
      if (err) {
        console.log(err);
      }
      else {
        console.log('succ');
        resolve();
      }
    });
  });
}

exports.downloadMAC = downloadMAC;
