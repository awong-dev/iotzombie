'use strict';

const express = require('express');

const returnRouter = (options) => {
  const logger = options.logger;
  // TODO(awong): Expire if there is no status heartbeat.
  const lightsState = {
    'parlor': { name: 'Parlor', isOn: false, lastHeartbeat: new Date() },
    'entry': { name: 'Entry', isOn: false, lastHeartbeat: new Date() },
  };

  const router = express.Router();
  router.get('/', (req, res) => {
    res.render('light-status.pug', { lightsState });
  });

  const apiRouter = express.Router();
  // Update heartbeat data from a device.
  //   isOn: boolean. True or false for requested light state.
  //   deviceSequence: an id number (likely just a sequence, but a random number
  //                   works fine too) representing the device's idea of the current
  //                   "version" for its state. Device's state is authoritative if
  //                   if deviceSequence doesn't match what is currently stored.
  //   name: Device's friendly name string. Should be /[a-zA-Z0-9 ]+/.
  apiRouter.post('/device/:lightId', (req, res) => {
    if (req.body.deviceSequence === undefined) {
      return res.status(400).send('Invalid value for deviceSequence');
    }

    if (req.body.name === undefined ||
        !(req.body.name.match(/[a-zA-Z0-9 ]+/))) {
      return res.status(400).send('Invalid value for name');
    }

    if (req.body.isOn === undefined ||
        !(req.body.isOn === true || req.body.isOn === false)) {
      return res.status(400).send('Invalid value for isOn');
    }

    // If the device has a newer state, it is authoritative. Otherwise, we are
    // authoritative.
    if (req.body.deviceSequence !== lightsState[req.params.lightId].deviceSequence) {
      lightsState[req.params.lightId] = {
        deviceSequence: req.body.deviceSequence,
        name: req.body.name,
        isOn: req.body.isOn,
        lastHeartbeat: new Date()
      };
    }

    res.json(lightsState[req.params.lightId]);
  });

  // Endpoint takes a status update in json. Parameters are:
  //   isOn: boolean. True or false for requested light state.
  apiRouter.post('/web/:lightId', (req, res) => {
    if (req.body.isOn === undefined ||
        !(req.body.isOn === true || req.body.isOn === false)) {
      return res.status(400).send('Invalid value for isOn');
    }

    if (!(req.params.lightId in lightsState)) {
      return res.status(400).send('Unknown light');
    }

    lightsState[req.params.lightId].isOn = req.body.isOn;

    res.json(lightsState[req.params.lightId]);
  });

  return { web: router, api: apiRouter, lightsStateForTest: lightsState };
};

module.exports = returnRouter;
