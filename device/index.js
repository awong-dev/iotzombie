'use strict';

const deviceUser = process.env.DEVICE_USER;
const deviceId = process.env.DEVICE_ID;
const deviceName = process.env.DEVICE_NAME || 'test light';
const devicePassword = process.env.DEVICE_PASSWORD;
const iotzServer = process.env.IOTZ_SERVER || 'http://localhost:8080';

const request = require('request');
const winston = require('winston');
const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({'timestamp':true})
  ]
});

const lightState = { name: deviceName, isOn: false, deviceSequence: 0 };

function updateLight(state) {
  // Talk to GPIO here.
}

function toggleLight(state) {
  // Talk to GPIO here.
  lightState.isOn = !lightState.isOn;
}

// TODO(awong): Pass lightState in via parameter.
function processStatusUpdate(err, resp, body) {
  logger.http('got response');
  logger.verbose(resp);
  if (err) {
    logger.error(`Error: ${err}`);
    return;
  }

  if (resp.statusCode !== 200) {
    logger.error(`Bad Status: ${resp.status}`);
    return;
  }

  const updatedValues = JSON.parse(body);
  if (body.deviceSequence === lightState.deviceSequence) {
    lightState.isOn = body.isOn;
    updateLight(lightState);
  }
}

function sendHeartbeat() {
  request.post( {
    url: `${iotzServer}/lights/${deviceId}`,
    method: 'POST',
    json: lightState,
    auth: {
      user: deviceUser,
      pass: devicePassword,
      sendImmediately: false
    }
  },
  processStatusUpdate);
}

setInterval(sendHeartbeat, 1000);
