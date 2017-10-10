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
