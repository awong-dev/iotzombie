'use strict';

const isPi = require('detect-rpi');
let gpio = null;
if (isPi()) {
  // rpi-gpio requires rpi.
  gpio = require('rpi-gpio');
} else {
  if (process.env.NODE_ENV !== 'development') {
    throw "non-rpi only supported in NODE_ENV=development";
  }
  // Mock the sucker.
  gpio = {
    read: (pin, cb) => { cb(null, 1); },
    write: (pin, val, cb) => { cb(); },
    setup: (pin, dir, edge, cb) => { if (cb) {cb()} else {edge();} },
    once: (event, cb) => { 
      process.once('SIGUSR2', () => {
        logger.info("hihi");
        cb();
      });
    },
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

module.exports = function (opts) {
  const logger = opts.logger;

  function listenForSwitch(onTriggerFunc) {
    // Interrupts are expressed as 'change' events from Gpio using the
    // EventEmitter interface. Use `once` to implement software debounce
    // by deregistering the listener after the first transition for 50ms.
    // Using 50ms for debounce seems to provide good protection and
    // responsiveness.
    gpio.once('change', () => {
      // Unconditionally call self to debounce.
      setTimeout(() => { listenForSwitch(onTriggerFunc); }, 50);

      // Read switch and respond.
      gpio.read(lightSwitchGpio, (err, value) => {
        if (err) {
          logger.error('Unable to read', err);
          return;
        }

        // Only respond to button events.
        if (value) {
          onTriggerFunc();
        }
      });
    });
  }

  function setupGpio(done) {
    gpio.setMode(gpio.MODE_BCM);
    async.parallel([
        (cb) => gpio.setup(lightPowerGpio, gpio.DIR_OUT, cb),
        (cb) => gpio.setup(lightSwitchGpio, gpio.DIR_IN, gpio.EDGE_FALLING, cb),
      ],
      (err) => done(err)
      );
  }

  function setupRelay(onTriggerFunc) {
    setupGpio((err) => {
      if (err) {
        logger.error('setup error', err);
        return;
      }

      listenForSwitch(onTriggerFunc);
    });
  }

  function setRelayState(isOn) {
    gpio.write(lightPowerGpio, isOn ? '1' : '0', (err) => {
      if (err) {
        logger.error('set relay state', err);
      }
    });
  }

  return { setupRelay, setRelayState };
};
