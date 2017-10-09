const admin = require("firebase-admin");
const firebase = require('firebase');
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

const updateRelay = require('./device/update-relay.js')({logger});

if (module === require.main) {
  const serviceAccount = require("./serviceAccountKey.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://iotzombie-153122.firebaseio.com"
  });

  const deviceState = {
    deviceClock: 3,  // TODO(ajwong): Move to random start.
    parlor: {
      name: 'Parlor',
      isOn: true,
      type: 'switch',
    },
    entry: {
      name: 'Entry',
      isOn: true,
      type: 'switch',
    },
    recirc: {
      name: 'Recirc Pump',
      isOn: false,
      type: 'button',
    },
  };

  const logDelta = (oldState, newState) => {
    logger.info("Old state: ", oldState, "New State: ", newState);
  }
  const deviceFunctions = {
    parlor: logDelta,
    entry: logDelta,
    recirc: null,
  };

  const devicesDbRef = admin.database().ref('/devices');
  devicesDbRef.on('value', (snapshot) => {
    const serverDeviceState = snapshot.val();
    if (serverDeviceState) {
      logger.info(JSON.stringify(serverDeviceState, null, 2));
      // Device state ALWAYS wins. If the device clock is out of sync,
      // then drop the server update and overwrite it with our data.
      if (serverDeviceState.deviceClock !== deviceState.deviceClock) {
        devicesDbRef.set(deviceState);
      } else {
        for (const deviceId in serverDeviceState) {
          const deviceFunc = deviceFunctions[deviceId];
          if (deviceFunc) {
            deviceFunc(deviceState[deviceId], serverDeviceState[deviceId]);
          }
        }
        // for each device, check if there's a change and if yes, then push
        // an update.
        //
        // Only ever update the state.
        Object.assign(deviceState, serverDeviceState);
      }
    }
  });
}
