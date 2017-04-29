'use strict';

// TODO(awong): this binds the state on the module load this is broken.

const gpio = require('rpi-gpio');
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

  function toggleLight(state, shouldToggle, cb) {
    if (shouldToggle) {
      Object.assign(state, {
          isOn: !state.isOn,
          deviceSequence: state.deviceSequence + 1
        });
      async.waterfall([
          (cb) => updateRelay(state.isOn, cb),
          (cb) => () => { doTrigger(); cb(); }
        ],
        (err) => cb(err));
    } else {
      cb(null);
    }
  }

  function listenForSwitch(state, done) {
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

    done();
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
      (cb) => listenForSwitch(state, cb),
      (cb) => updateRelay(state, cb),
    ],
    (err) => {
      if (err) {
        logger.error(JSON.stringify(err));
      }
    });


  return updateRelay;
};
