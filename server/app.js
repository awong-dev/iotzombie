'use strict';

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const basicAuth = require('express-basic-auth');
const morgan = require('morgan');
const winston = require('winston');

const app = express();

// Setup up logger.
var logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      level:            'debug',
      handleExceptions: true,
      json:             false,
      colorize:         true,
      timestamp: true
    })
  ],
  exitOnError: false
});

logger.stream = {
  write: (message, encoding) => {
    logger.info(message);
  }
};
 
app.use(require("morgan")("combined", { "stream": logger.stream }));

const auth = basicAuth({
  users: { 'admin': 'supersecret' },
  challenge: true
});

app.use(bodyParser.json());

const lights = {
  'parlor': { name: 'Parlor', isOn: false },
  'entry': { name: 'Entry', isOn: false },
};

app.use('/', express.static('public'));

app.use('/generated', express.static('build/generated'));

app.get('/lights', auth, (req, res) => {
  res.render('light-status.pug', { lights });
});

// Endpoint takes a status update in json. Parameters are:
//   isOn: boolean. True or false for requested light state.
//   deviceSequence: an id number (likely just a sequence, but a random number
//                   works fine too) representing the device's idea of the current
//                   "version" for its state. This is not required or used by the
//                   webform. It's for receiving heartbeats so the device can
//                   override the server state.
app.post('/lights/:lightId', (req, res) => {
  // Determine if we should update by examining the deviceSequence value.
  // If present, it means the update is being posted by a device and the
  // value is a change number representing the current number of physical
  // clicks from the physical button next to the device.
  //
  // If this value does not match what is recorded on the server, then
  // it means the server is out of date with what someone physically
  // next to the device has done. The device state is then taken as
  // authoritative and wipes out the server state.
  //
  // If the light change request comes from the web ui, there will be no
  // deviceSequence value and the server should assume it may control the
  // state.
  const deviceSequence = req.body.deviceSequence;

  // deviceSequence == undefined -- ignore
  // deviceSequence === recorded -- ignore.
  // deviceSequence !== recorded -- update
  // server == undefined -- update
  if (!(req.lightId in lights) ||
      (deviceSequence !== undefined &&
       deviceSequence !== lights[req.params.lightId].deviceSequence)) {
    logger.debug(req.params.lightId);
    logger.debug(req.body.isOn);
    const newValues = {
      isOn: req.body.isOn,
      deviceSequence
    }; 
    lights[req.params.lightId] = Object.assign(lights[req.params.lightId] || {}, newValues);
  }

  logger.debug(lights);
  res.json(lights[req.params.lightId]);
});


if (module === require.main) {
  const server = app.listen(process.env.PORT || 8080, () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
}

module.exports = app;
