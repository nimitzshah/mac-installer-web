const fse = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
var request = require('request');
var packager = require('../mac-installer')
const cluster = require('cluster');

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
  format: combine(
    label({ label: 'MINI SERVICE' }),
    timestamp(),
    myFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'service.log' })
  ]
});

function downloadMAC(req, res) {
  logger.log({
    level: 'info',
    message: `request recieved for worker #${cluster.worker.id}`
  });
  var download = {}; //HACK
  download.outputFile = req.body.name;
  download.config = req.body.message;
  download.id = crypto.randomBytes(4).toString("hex");
  download.time = new Date();
  download._folder = path.join('public', download.id);
  download._fileName = (download.outputFile || "openfin-installer") + ".dmg";
  download._path = path.join(download._folder, download._fileName);

  produceMacFile(download)
    .then(() => {
      logger.log({
        level: 'info',
        message: `successfully create dmg: ${download.outputFile} with ${download.config}`
      });
      return new Promise(resolve => {
        res.download(download._path, err => {
          if (err) {
            logger.log({
              level: 'error',
              message: `unable to send dmg: ${err}`
            });
            if(err.status)
              res.status(err.status).end();
            else
              res.status(500).send("Something went wrong. Please contact support@openfin.co");
          }
          resolve();
        });
      });
    })
    .catch(err => {
      logger.log({
        level: 'error',
        message: `unable to create ${download.outputFile} with ${download.config}: ${err}`
      });
      res.statusMessage = err;
      res.status(500).end();
    })
    .then(() => {
      // Cleanup
      fse.remove(download._folder, err => {
        if (err) {
          logger.log({
            level: 'error',
            message: `unable to delete tmp file: ${err}`
          });
        }
      });
    });
}

//=====================================================================
// Call Mac Installer Service
//=====================================================================
function produceMacFile(download) {
  return new Promise((resolve, reject) => {
   packager({
      flags:{
          "c" : download.config,
          "n" : download.outputFile,
          "f" : download._folder
      }
    },function done (err) {
      if (err) {
        reject(err);
      }
      else {
        resolve();
      }
    });
  });
}

exports.downloadMAC = downloadMAC;
