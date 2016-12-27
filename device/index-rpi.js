'use strict';

const deviceUser = process.env.DEVICE_USER;
const deviceId = process.env.DEVICE_ID;
const deviceName = process.env.DEVICE_NAME || 'test light';
const devicePassword = process.env.DEVICE_PASSWORD;
const iotzServer = process.env.IOTZ_SERVER || 'http://localhost:8080';

// GPIO16 (is pin 36) which defaults to pull-down. Set it that way anyways
// just to be certain.  Low is off on the relay.
const lightControlGpio = 16;
const gpioRoot = '/sys/class/gpio';
const gpioLightControlPath = `${gpioRoot}/gpio${lightControlGpio}`;

const fs = require('fs');
const gpio = require('rpi-gpio');
const request = require('request');
const winston = require('winston');

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level:            'info',
      handleExceptions: true,
      json:             false,
      colorize:         true,
      timestamp: true
    })
  ]
});


function setupGpio(done) {
  gpio.setMode(gpio.MODE_BCM);
  async.series([
      (cb) => gpio.setup(lightControlGpio, gpio.DIR_OUT, cb),
    ],
    (err) => done(err)
    );
}

function updateLight(isOn, cb) {
  gpio.write(lightControlGpio, isOn ? '1' : '0', (err) => {
    return cb(err);
  });
}

function toggleLight(state) {
  // Talk to GPIO here.
  lightState.isOn = !lightState.isOn;
}

function processStatusUpdate(err, resp, body, prevState, cb) {
  if (err) {
    return cb(err);
  }

  logger.info(`Heatbeat response: [${resp.statusCode}] ${JSON.stringify(body)}`);
  if (resp.statusCode !== 200) {
    return cb(`Bad Status: ${resp.statusCode}`);
  }

  // Only override out on state if the server shows that it was aware of our
  // previous state.
  if (parseInt(body.deviceSequence) === prevState.deviceSequence
      && prevState.isOn !== body.isOn) {
    const newState = Object.assign({}, prevState);
    newState.isOn = body.isOn;
    logger.info(`Transitioning state from ${prevState.isOn} to ${newState.isOn}`);
    return updateLight(newState.isOn, (err) => { cb(err, newState); });
  }

  return cb(null, prevState);
}

function sendHeartbeat(state, done) {
  request.post( {
    url: `${iotzServer}/api/lights/device/${deviceId}`,
    method: 'POST',
    json: state,
    auth: {
      user: deviceUser,
      pass: devicePassword,
      sendImmediately: true
    }
  },
  (err, resp, body) => {
    processStatusUpdate(err, resp, body, state, (err, newState) => {
        if (err) {
          console.error(JSON.stringify(err));
        }
        Object.assign(state, newState);
        done();
      });
  });
}


if (module === require.main) {
  const lightState = { name: deviceName, isOn: false, deviceSequence: 0 };
  const heartbeatPeriod = 5000;
  async.series([
      setupGpio,
      (cb) => updateLight(lightState.isOn, cb),
    ],
    (err) {
      if (err) {
        logger.error(JSON.stringify(err));
      }
    });
  const startHeartbeat = () => {
    sendHeartbeat(lightState, () => {
        // Jittered heartbeat.
        setTimeout(startHeartbeat, (heartbeatPeriod / 2) + (Math.random() * heartbeatPeriod));
      });
  };
  startHeartbeat();
  logger.info(`Heatbeat started. Period: ${heartbeatPeriod}`);
}

module.exports = {sendHeartbeat, processStatusUpdate, updateLight, toggleLight};
