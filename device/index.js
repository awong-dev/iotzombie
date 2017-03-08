'use strict';

const deviceUser = process.env.DEVICE_USER;
const deviceId = process.env.DEVICE_ID;
const deviceName = process.env.DEVICE_NAME || 'test light';
const devicePassword = process.env.DEVICE_PASSWORD;
const iotzServer = process.env.IOTZ_SERVER || 'http://localhost:8080';

// GPIO16 (physical pin 36) defaults to pull-down. Low is off on the relay
// so this is a good default.
const lightPowerGpio = 16;

// GPIO8 (physical pin 24) defaults to pull-up. Having the switch sourced
// to ground felt better...no real reason otherwise for the choice. It means
// interrupt should trigger on falling edge and expect false on read for
// debounce.
const lightSwitchGpio = 8;

const async = require('async');
const gpio = require('rpi-gpio');
const request = require('request');
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

function listenForSwitch(state) {
  // Interrupts are expressed as 'change' events from Gpio using the
  // EventEmitter interface. Use `once` to implement software debounce.
  // Using 10ms for debounce seems to provide good protection and
  // responsiveness.
  gpio.once('change', () => {
      setTimeout(() => {
        // Actually attempt to read the input value after 10 secs
        // and then reschedule the listener.
        async.waterfall([
            (cb) => {
              gpio.read(lightSwitchGpio, (err, value) => {
                cb(err, value === false);
              });
            },
            (shouldToggle, cb) => toggleLight(state, shouldToggle, cb)
          ],
          (err, value) => {
            if (err) {
              logger.error(JSON.stringify(err));
            }
            listenForSwitch(state);
          });
      }, 10);
    });
}

function setupGpio(done) {
  gpio.setMode(gpio.MODE_BCM);
  async.series([
      (cb) => gpio.setup(lightPowerGpio, gpio.DIR_OUT, cb),
      (cb) => gpio.setup(lightSwitchGpio, gpio.DIR_IN, gpio.EDGE_FALLING, cb),
    ],
    (err) => done(err)
    );
}

function updateLight(isOn, cb) {
  gpio.write(lightPowerGpio, isOn ? '1' : '0', (err) => {
    return cb(err);
  });
}

function toggleLight(state, shouldToggle, cb) {
  if (shouldToggle) {
    Object.assign(state, {
        isOn: !state.isOn,
        deviceSequence: state.deviceSequence + 1
      });
    async.waterfall([
        (cb) => updateLight(state.isOn, cb),
        (cb) => sendHeartbeat(state, cb)
      ],
      (err) => cb(err));
  } else {
    cb(null);
  }
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
          return done(err);
        }
        Object.assign(state, newState);
        done(null);
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
    (err) => {
      if (err) {
        logger.error(JSON.stringify(err));
      }
    });
  const startHeartbeat = () => {
    sendHeartbeat(lightState, (err) => {
        // Jittered heartbeat.
        if (err) {
          console.error(JSON.stringify(err));
        }
        setTimeout(startHeartbeat, (heartbeatPeriod / 2) + (Math.random() * heartbeatPeriod));
      });
  };
  listenForSwitch(lightState);
  startHeartbeat();
  logger.info(`Heatbeat started. Period: ${heartbeatPeriod}`);
}

module.exports = {sendHeartbeat, processStatusUpdate, updateLight, toggleLight};
