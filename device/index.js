'use strict';

const deviceName = process.env.DEVICE_NAME || 'test light';
const deviceId = process.env.DEVICE_ID;

const winston = require('winston');

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level:            'info',
      handleExceptions: true,
      json:             false,
      colorize:         false,
      timestamp: false
    })
  ]
});

if (module === require.main) {
  const lightState = { name: deviceName, isOn: false, deviceSequence: 0 };
  const pumpState = { name: 'Pump', isOn: false, deviceSequence: 0 };
  const heartbeatPeriod = 5000;

//  const updateRelay = () => { logger.info('wut');};
  const updateRelay = require('./update-relay.js')({logger, state: lightState});
  const updatePump = require('./pump.js')({logger, state: pumpState});
  const startHeartbeat = require('./heartbeat.js')({logger});
  startHeartbeat(lightState, deviceId, heartbeatPeriod, updateRelay);
  startHeartbeat(pumpState, 'pump', heartbeatPeriod, updatePump);
  logger.info(`Heatbeat started. Period: ${heartbeatPeriod}`);
}
