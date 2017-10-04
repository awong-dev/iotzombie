const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const bodyParser = require('body-parser');
const pick = require('lodash/pick');

const app = express();
app.use(bodyParser.json());

admin.initializeApp(functions.config().firebase);

function isValidDeviceId(str) {
  return /^(0|[1-9]\d*)$/.test(str);
}

// Authentication middlewear. Expects an OAuth2 token that can be decided by firebase.
// Allowed Auth providers handled via the firebase configuraiton portal.
// After this middlewear, |req| will have a |user| and an |access_type| field that
// can be used for identity and authorization.
function authenticate(req, res, next) {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    res.status(403).send('Unauthorized');
    return;
  }
  const idToken = req.headers.authorization.split('Bearer ')[1];
  admin.auth().verifyIdToken(idToken).then(decodedIdToken => {
    req.user = decodedIdToken;
    const user_info = pick(req.user, ['email', 'email_verified', 'name']);
    user_info.sign_in_provider = req.user.firebase.sign_in_provider
    admin.database().ref(`/users/${req.user.sub}/info`).set(user_info);
    admin.database().ref(`/users/${req.user.sub}/access_type`).once('value').then(snapshot => {
	 if (['user', 'device'].includes(snapshot.val())) {
	   req.access_type = snapshot.val();
	   next();
	 } else {
	   res.status(403).send('Unauthorized');
	 }
    });
  }).catch(error => {
    console.error('Unable to authenticate', error.message);
    res.status(403).send('Unauthorized');
  });
}

app.use(authenticate);

// Put allows for creation or updating of the device.
// Required parameter is isOn (how to handle recirc pump?).
//
// If It is a device TODO(awong): Add authenication layer, then also accepts 
// updates to the name, deviceSequence, and heartbeat parameter.
// TODO(awong): Heartbeat should not be required if we can detect FCM clients.
//
// Request https://www.googleapis.com/auth/userinfo.email scope.
app.put('/api/devices/:deviceId', (req, res) => {
  const deviceId = req.params.deviceId;
  // TODO Validate other input.
  if (!isValidDeviceId(deviceId)) {
    res.status(400).json({errorCode: 400, errorMessage: `Invalid device Id '${deviceId}'`});
    return;
  }
  admin.database().ref(`/devices/${deviceId}`).transaction(
    (deviceState) => {
      if (req.access_type == 'device') {
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
app.get('/api/devices/:deviceId', (req, res) => {
  const deviceId = req.params.deviceId;
  if (!isValidDeviceId(deviceId)) {
    res.status(400).json({errorCode: 400, errorMessage: `Invalid device Id '${deviceId}'`});
    return;
  }
  admin.database().ref(`/devices/${deviceId}`).once('value').then(snapshot => {
    if (snapshot.val() !== null) {
      res.status(200).json(snapshot.val());
    } else {
      res.status(404).json({errorCode: 404, errorMessage: `device '${deviceId}' not found`});
    }
  }).catch(error => {
    console.error('Error getting state for deviceId', deviceId, error.message);
    res.sendStatus(500);
  });
});

exports.api = functions.https.onRequest(app);
