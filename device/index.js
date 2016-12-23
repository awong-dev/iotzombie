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

function writeValue(path, value) {
  const fd = fs.openSync(path, "w");
  fs.writeSync(fd, value);
  fs.closeSync(fd);
}

function setupGpio() {
  if (!fs.existsSync(gpioLightControlPath)) {
    writeValue(`${gpioRoot}/export`, `${lightControlGpio}`);
  }
  writeValue(`${gpioLightControlPath}/direction`, 'out');
}

// TODO(awong): You have a race here. Careful. Another updateLight operation can start before this is done.
function updateLight(isOn) {
  writeValue(`${gpioLightControlPath}/value`, isOn ? '1' : '0');
}

function toggleLight(state) {
  // Talk to GPIO here.
  lightState.isOn = !lightState.isOn;
}

// TODO(awong): Pass lightState in via parameter.
function processStatusUpdate(err, resp, body, prevState) {
  if (err) {
    logger.error(err);
    return;
  }

  logger.info(`Heatbeat response: [${resp.statusCode}] ${JSON.stringify(body)}`);
  if (resp.statusCode !== 200) {
    logger.error(`Bad Status: ${resp.statusCode}`);
    return;
  }

  // Only override out on state if the server shows that it was aware of our
  // previous state.
  if (parseInt(body.deviceSequence) === prevState.deviceSequence
      && prevState.isOn !== body.isOn) {
    const newState = Object.assign({}, prevState);
    newState.isOn = body.isOn;
    logger.info(`Transitioning state from ${prevState.isOn} to ${newState.isOn}`);
    updateLight(newState.isOn);
    return newState;
  }

  return prevState;
}

function sendHeartbeat(state) {
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
    Object.assign(state, processStatusUpdate(err, resp, body, state));
  });
}


if (module === require.main) {
  const lightState = { name: deviceName, isOn: false, deviceSequence: 0 };
  const heartbeatPeriod = 10000;
  setupGpio();
  updateLight(lightState.isOn);
  sendHeartbeat(lightState);
  setInterval(() => { sendHeartbeat(lightState) }, heartbeatPeriod);
  logger.info(`Heatbeat started. Period: ${heartbeatPeriod}`);
}

module.exports = {sendHeartbeat, processStatusUpdate, updateLight, toggleLight};
