const admin = require("firebase-admin");
const firebase = require('firebase');
const winston = require('winston');

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

  const updateParlor = (oldState, newState) => {
    setRelayState(newState);
  }

  const deviceFunctions = {
    parlor: updateParlor,
    entry: null,
    recirc: null,
  };

  const devicesDbRef = admin.database().ref('/devices');
  devicesDbRef.on('value', (snapshot) => {
    const serverDeviceState = snapshot.val();
    if (serverDeviceState) {
      // Device state ALWAYS wins. If the device clock is out of sync,
      // then drop the server update and overwrite it with our data.
      if (serverDeviceState.deviceClock !== deviceState.deviceClock) {
        devicesDbRef.set(deviceState);
      } else {
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
  setupRelay(() => {
    deviceState.deviceClock++;
    deviceState.parlor.isOn = !deviceState.parlor.isOn;
    devicesDbRef.set(deviceState);
  });
}
