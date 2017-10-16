const admin = require("firebase-admin");
const winston = require('winston');
const express = require('express');
const axios = require('axios');

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

// These are hardcoded values from the zwave network.
const zWayIds = {
  backporch: 'ZWayVDev_zway_2-0-37',
  recirc: 'ZWayVDev_zway_3-0-37',
  entry: 'ZWayVDev_zway_16-1-37',
  frontporch: 'ZWayVDev_zway_16-2-37',
};
const zWayDevApiBase = 'http://127.0.0.1:8083/ZAutomation/api/v1/devices'

const {setupRelay, setRelayState} = require('./device/relay.js')({logger});

if (module === require.main) {
  const serviceAccount = require(process.env.SERVICE_ACCOUNT_KEY || './serviceAccountKey.json');

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
    backporch: {
      name: 'Back Porch',
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
    frontporch: {
      name: 'Front Porch',
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

  const updateZWay = (oldState, newState, id) => {
    if (oldState !== newState) {
      const cmdUrl = `${zWayDevApiBase}/${zWayIds[id]}/command/${newState ? 'on' : 'off'}`;
      axios.get(cmdUrl)
        .catch(err => {
          logger.error(`Failed set state ${newState} for ZWay ${id}: ${cmdUrl}`, err)
        });
    }
  }

  const deviceFunctions = {
    backporch: updateZWay,
    entry: updateZWay,
    frontporch: updateZWay,
    parlor: updateParlor,
    recirc: updateZWay,
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
            deviceFunc(deviceState[deviceId].isOn, serverDeviceState[deviceId].isOn, deviceId);
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

  function updateZWayState() {
    for (const id in zWayIds) {
      axios.get(`${zWayDevApiBase}/${zWayIds[id]}`)
        .then(response => {
          if (deviceState[id]) {
            const newState = response.data.data.metrics.level === 'on';
            logger.info(`Found state for ${id}: ${newState} [raw: ${response.data.data.metrics.level}]`);
            if (deviceState[id].isOn !== newState) {
              logger.info(`Updating ${id}`);
              deviceState.deviceClock++;
              deviceState[id].isOn = newState;
              devicesDbRef.set(deviceState);
            }
          }
        })
        .catch(err => logger.error(`Failed get status for ZWay ${id}`, err));
    }
  }

  function createZWayWebhook() {
    const app = express();
    app.get('/zwayhook/action/on', (req, res) => {
      updateZWayState();
      logger.info("zwayhook on received");
      res.send("on");
    });
    app.get('/zwayhook/action/off', (req, res) => {
      updateZWayState();
      logger.info("zwayhook off received");
      res.send("off");
    });
    app.get('/zwayhook/get/value', (req, res) => {
      logger.info("zwayhook value requested. This shouldn't happen...'");
      res.send("off");
    });
    return app;
  }

  const zwayWebhook = createZWayWebhook().listen(1173 /* "lite" */, '127.0.0.1', () => {
    logger.info(`Listenting on ${zwayWebhook.address().address}:${zwayWebhook.address().port}`);
  })
}
