const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

admin.initializeApp(functions.config().firebase);

// Put allows for creation or updating of the device.
// Required parameter is isOn (how to handle recirc pump?).
//
// If It is a device TODO(awong): Add authenication layer, then also accepts 
// updates to the name, deviceSequence, and heartbeat parameter.
// TODO(awong): Heartbeat should not be required if we can detect FCM clients.
//
app.put('/devices/:deviceId', (req, res) => {
  const deviceId = req.params.deviceId;
  const isPutFromActualDevice = req.body.isDevice;
  console.error(`Coming from: ${isPutFromActualDevice} ${JSON.stringify(req.params)} ${JSON.stringify(req.body)}`);
  // TODO Validate input.
  admin.database().ref(`/devices/${deviceId}`).transaction(
    (deviceState) => {
      if (isPutFromActualDevice) {
        deviceState = {
          'name': req.body.name,
          'lastHeartbeat': new Date(),
          'deviceSequence': req.body.deviceSequence
        }
      }

      // Rely on the previous conditional to populate the variable if request is
      // from a device. This handles create.
      if (deviceState) {
        deviceState.isOn = req.body.isOn;
      }
      return deviceState;
    },
    (err, isCommitted, snapshot) => {
      if (!isCommitted) {
        res.sendStatus(500);
      } else if (!snapshot.exists()) {
        res.status(404).json({errorCode: 404, errorMessage: `device '${deviceId}' not found`});
      } else {
        res.sendStatus(200);
      }
    }).catch(error => {
      console.log('Error putting state for deviceId', deviceId, error.message);
      res.sendStatus(500);
  });
});

// Retrieves the current status.
app.get('/devices/:deviceId', (req, res) => {
  const deviceId = req.params.deviceId;
  // TODO Validate input.
  admin.database().ref(`/devices/${deviceId}`).once('value').then(snapshot => {
    if (snapshot.val() !== null) {
      // Cache details in the browser for 5 minutes
      res.set('Cache-Control', 'private, max-age=300');
      res.status(200).json(snapshot.val());
    } else {
      res.status(404).json({errorCode: 404, errorMessage: `device '${deviceId}' not found`});
    }
  }).catch(error => {
    console.log('Error getting state for deviceId', deviceId, error.message);
    res.sendStatus(500);
  });
});

exports.api = functions.https.onRequest(app);
