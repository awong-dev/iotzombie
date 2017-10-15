const admin = require("firebase-admin");
const winston = require('winston');
const express = require('express');

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level:            'info',
      handleExceptions: true,
      prettyPrint: (object) => JSON.stringify(object, null, 2),
      json:             false,
      colorize:         true,
      timestamp: true
    })
  ]
});

const {setupRelay, setRelayState} = require('./device/relay.js')({logger});

if (module === require.main) {
  const serviceAccount = require(process.env.SERVICE_ACCOUNT_KEY || './serviceAccountKey.json');

  function createZwayWebhook() {
    const app = express();
    app.get('/zwayhook/action/on', (req, res) => {
      logger.info("zwayhook set to on on");
      res.send("on");
    });
    app.get('/zwayhook/action/off', (req, res) => {
      logger.info("zwayhook set to off");
      res.send("off");
    });
    app.get('/zwayhook/get/value', (req, res) => {
      logger.info("zwayhook value requested");
      res.send("off");
    });
    return app;
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://iotzombie-153122.firebaseio.com"
  });

  const deviceState = {
    deviceClock: (new Date).getTime(),
    parlor: {
      name: 'Parlor',
      isOn: false,
      type: 'switch',
      icon: 'lightbulb_outline',
    },
    entry: {
      name: 'Entry',
      isOn: false,
      type: 'switch',
      icon: 'lightbulb_outline',
    },
    recirc: {
      name: 'Recirc Pump',
      isOn: false,
      type: 'button',
      icon: 'repeat',
    },
  };

  const updateParlor = (oldState, newState) => {
    if (oldState !== newState) {
      setRelayState(newState);
    }
  }

  const deviceFunctions = {
    parlor: updateParlor,
    entry: null,
    recirc: null,
  };

  const devicesDbRef = admin.database().ref(
    process.env.NODE_ENV === 'production' ? '/devices' : '/devicesdev');
  devicesDbRef.on('value', (snapshot) => {
    const serverDeviceState = snapshot.val();
    if (serverDeviceState) {
      // Device state ALWAYS wins. If the device clock is out of sync,
      // then drop the server update.
      if (serverDeviceState.deviceClock !== deviceState.deviceClock) {
        logger.info(`Server had outdated deviceClock. Server: ${serverDeviceState.deviceClock}. Local: ${deviceState.deviceClock}`);
        devicesDbRef.set(deviceState);
      } else {
        logger.info('Received Server update.');
        // For each device, check if there's a change and if yes, then push
        // an update.
        for (const deviceId in serverDeviceState) {
          const deviceFunc = deviceFunctions[deviceId];
          if (deviceFunc) {
            deviceFunc(deviceState[deviceId].isOn, serverDeviceState[deviceId].isOn);
          }
          deviceState[deviceId].isOn = serverDeviceState[deviceId].isOn;
        }
      }
    }
  });

  // setupRelay() takes a function that is called on toggle.
  setupRelay(deviceState.parlor.isOn, () => {
    const oldState = deviceState.parlor.isOn
    deviceState.parlor.isOn = !deviceState.parlor.isOn;
    logger.info(`Local switch triggered: ${oldState} -> ${deviceState.parlor.isOn}`);
    deviceState.deviceClock++;
    setRelayState(deviceState.parlor.isOn);
    devicesDbRef.set(deviceState);
  });

  const zwayWebhook = createZwayWebhook().listen(1173 /* "lite" */, '127.0.0.1', () => {
    logger.info(`Listenting on ${zwayWebhook.address().address}:${zwayWebhook.address().port}`);
  })
}
