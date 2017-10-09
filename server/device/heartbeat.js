'use strict';

const request = require('request');

const deviceUser = process.env.DEVICE_USER;
const devicePassword = process.env.DEVICE_PASSWORD;
const iotzServer = process.env.IOTZ_SERVER || 'http://localhost:8080';

module.exports = function(opts) {
  const logger = opts.logger;

  function processStatusUpdate(err, resp, body, prevState, onUpdate, cb) {
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
      logger.info(`Transitioning state from ${JSON.stringify(prevState)} to ${JSON.stringify(newState)}`);
      return onUpdate(newState, (err) => { cb(err, newState); });
    }

    return cb(null, prevState);
  }

  function sendHeartbeat(state, deviceId, onUpdate, done) {
    request.post({
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
      processStatusUpdate(err, resp, body, state, onUpdate, (err, newState) => {
          if (err) {
            return done(err);
          }
          Object.assign(state, newState);
          done();
        });
    });
  }

  return (function startHeartbeat(state, deviceId, heartbeatPeriod, onUpdate) {
    const closure = () => {
      const wrappedOnUpdate = (state, cb) => {
        onUpdate(state,
                 () => {
                   sendHeartbeat(state, deviceId, wrappedOnUpdate, (err) => {
                     if (err) {
                       console.error(`Error: ${JSON.stringify(err)}`);
                     }
                   });
                 },
                 cb);
      };
      sendHeartbeat(state, deviceId, wrappedOnUpdate, (err) => {
          // Jittered heartbeat.
          if (err) {
            console.error(`Error: ${JSON.stringify(err)}`);
          }
          const nextHeartbeat = (heartbeatPeriod / 2) + (Math.random() * heartbeatPeriod);
          setTimeout(closure, nextHeartbeat);
        });
    };

    closure();
  });
};
