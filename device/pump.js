'use strict';

const request = require('request');

const pumpUrl = 'http://localhost:8083/ZAutomation/api/v1/devices/ZWayVDev_zway_3-0-37/command/on';
const pumpTimeout = 30000;  // 30 seconds seems to be how long it runs.

module.exports = function (opts) {
  const logger = opts.logger;
  const state = opts.state;

  // Set the state to off when the pump disables itself.
  function pumpStateOff(triggerFunc) {
    Object.assign(state, {
        isOn: false,
        deviceSequence: state.deviceSequence + 1
      });
    triggerFunc();
  }

  return (function updatePump(state, triggerFunc, cb) {
    if (state.isOn) {
      request(pumpUrl, (err, resp, body) => {
          setTimeout(() => { pumpStateOff(triggerFunc); }, pumpTimeout);
          return cb(err);
        });
    }
  });
};
