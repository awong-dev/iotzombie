# IotZombie

Simple node.js server for orchtestrating IOT devices.
The server expects to only keep in memory state. All IoT
devices are to be correctly timestamped with NTP and to publish
their own local state periodicially back to the server. The
server then examine the timestamp and update its own state accordingly
if it's older. This eventual consistency model does not require
a server side persistent datastore.

Endpoints:
/lights - IOT state server for lights in the house.

----

Redo this as Firebase + FCM and Cloud functions.
GET /api/lights -> Read from database.
PUT /api/lights -> Write to db and send FCM Update.

Device is in read loop. Every X days since last update, sends a new PUT.

(1) get static content from GET/PUT in firebase
(2) COnnect GET/Put to DB
(3) Create right DB model
(4) Send FCM event
(5) Listen to FCM event from node.

----

Firebase setup.  For this, we need both the database to be setup
and also Custom Auth Tokens configured to allow for device-authentication.
Otherwise, the device has to masquerade as a user with all the identity
problems that presents. Bleck. Luckily, that basicaly means creating
a cloud function that can produce a signed JWT token using the googleapi
for signing. And then creating a simple auth scheme so the API can
authenticate the device before returning the JWT. Ideally there should
also be some rate limiting to prevent abuse.

1. `go get firebase.google.com/go`   # Enable the firebase SDK.
1. `gcloud services enable iam.googleapis.com`  # Enables signBlob API.
1. Go to https://console.cloud.google.com/iam-admin/iam and add the "Service account token creator" to the App Engine default service account.
1. `cd functions/auth`  # If writing from scratch, don't forget go mod init iotz; go mod tidy; otherwise gcloud won't install the deps.
1. `gcloud functions deploy get_firebase_db_token --entry-point GetFirebaseDbToken --runtime go111 --trigger-http`
