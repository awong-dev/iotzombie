'use strict';

const isPi = require('detect-rpi');
if (isPi()) {
  // rpi-gpio requires rpi.
  const gpio = require('rpi-gpio');
} else {
  if (process.env.NODE_ENV !== 'development') {
    throw "non-rpi only supported in NODE_ENV=development";
  }
  // Mock the sucker.
  const gpio = {
    read: (pin, cb) => { cb(null, 1); },
    write: (pin, val, cb) => { cb(); },
    setup: (pin, dir, edge, cb) => { if (cb) {cb()} else {edge();} },
    once: (event, cb) => { cb(); },
    setMode: (value) => {},
  };
}
const async = require('async');

// GPIO16 (physical pin 36) defaults to pull-down. Low is off on the relay
// so this is a good default.
const lightPowerGpio = 16;

// GPIO8 (physical pin 24) defaults to pull-up. Having the switch sourced
// to ground felt better...no real reason otherwise for the choice. It means
// interrupt should trigger on falling edge and expect false on read for
// debounce.
const lightSwitchGpio = 8;

var storedTriggerFunc = null;
function doTrigger() {
  if (storedTriggerFunc) {
    storedTriggerFunc();
  }
}

function updateRelay(state, triggerFunc, cb) {
  storedTriggerFunc = triggerFunc;
  gpio.write(lightPowerGpio, state.isOn ? '1' : '0', (err) => {
    return cb(err);
  });
}

module.exports = function (opts) {
  const logger = opts.logger;
  const state = opts.state;

  function toggleLight(shouldToggle, cb) {
    if (shouldToggle) {
      Object.assign(state, {
          isOn: !state.isOn,
          deviceSequence: state.deviceSequence + 1
        });
      async.waterfall([
          (cb) => updateRelay(state, storedTriggerFunc, cb),
          (cb) => { doTrigger(); cb(); }
        ],
        (err) => cb(err));
    } else {
      cb(null);
    }
  }

  function listenForSwitch() {
    // Interrupts are expressed as 'change' events from Gpio using the
    // EventEmitter interface. Use `once` to implement software debounce.
    // Using 50ms for debounce seems to provide good protection and
    // responsiveness.
    gpio.once('change', () => {
      async.waterfall([
          (cb) => {
            gpio.read(lightSwitchGpio, (err, value) => {
              // Only respond to button down.
              cb(err, value === false);
            });
          },
          toggleLight
        ],
        (err) => {
          if (err) {
            logger.error(JSON.stringify(err));
          }
          setTimeout(() => {
              listenForSwitch();
              }, 50);
        });
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

  async.series([
      setupGpio,
      (cb) => { listenForSwitch(); cb(); },
      (cb) => updateRelay(state, storedTriggerFunc, cb),
    ],
    (err) => {
      if (err) {
        logger.error(JSON.stringify(err));
      }
    });


  return updateRelay;
};
