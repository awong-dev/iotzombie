'use strict';

const express = require('express');

const returnRouter = (options) => {
  const logger = options.logger;

  // TODO(awong): Expire if there is no status heartbeat.
  const lightsState = {
    parlor: {deviceSequence:0, name: "Parlor", isOn:false, lastHeartbeat: new Date() }
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
      return res.status(400).json({ error: 'Invalid value for deviceSequence' });
    }

    if (req.body.name === undefined ||
        !(req.body.name.match(/[a-zA-Z0-9 ]+/))) {
      return res.status(400).json({ error: 'Invalid value for name' });
    }

    if (!(req.body.isOn === true || req.body.isOn === false)) {
      return res.status(400).json({ error: 'Invalid value for isOn' });
    }

    // If the device has a newer state, it is authoritative. Otherwise, we are
    // authoritative.
    const lightId = req.params.lightId;
    const lastHeartbeat = new Date();
    if (!(lightId in lightsState) ||
        req.body.deviceSequence !== lightsState[lightId].deviceSequence) {
      lightsState[lightId] = {
        deviceSequence: req.body.deviceSequence,
        name: req.body.name,
        isOn: req.body.isOn,
        lastHeartbeat
      };
      logger.info(`Added ${lightId} with ${JSON.stringify(lightsState[lightId])}`);
    } else {
      // Just update the heartbeat.
      lightsState[lightId].lastHeartbeat = lastHeartbeat;
      logger.info(`Heartbeat: ${JSON.stringify(lightsState[lightId])}`);
    }

    res.json(lightsState[lightId]);
  });

  // Endpoint takes a status update in json. Parameters are:
  //   isOn: boolean. True or false for requested light state.
  apiRouter.post('/ui/:lightId', (req, res) => {
    if (!(req.body.isOn === true || req.body.isOn === false)) {
      const error = `Invalid value for isOn: ${req.body.isOn}`
      logger.warn(error);
      return res.status(400).json({ error });
    }

    const lightId = req.params.lightId;
    if (!(lightId in lightsState)) {
      const error = `Unknown light: ${lightId}`
      logger.warn(error);
      logger.warn(lightsState);
      return res.status(400).json({ error });
    }

    lightsState[lightId].isOn = req.body.isOn;

    logger.debug(`Set ${lightId} to ${JSON.stringify(lightsState[lightId])}`);
    res.json(lightsState[lightId]);
  });

  apiRouter.get('/ui/:lightId', (req, res) => {
    const lightId = req.params.lightId;
    if (!(lightId in lightsState)) {
      const error = `Unknown light: ${lightId}`
      logger.warn(error);
      logger.warn(lightsState);
      return res.status(400).json({ error });
    }

    logger.debug(`Get ${lightId}: ${JSON.stringify(lightsState[lightId])}`);
    res.json(lightsState[lightId]);
  });

  return { ui: router, api: apiRouter, lightsStateForTest: lightsState };
};

module.exports = returnRouter;
