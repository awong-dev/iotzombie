# IotZombie

Simple node.js server for orchtestrating IOT devices.
The server expects to only keep in memory state. All IoT
devices are to be correctly timestamped with NTP and to publish
their own local state periodicially back to the server. The
server then examine the timestamp and update its own state accordingly
if it's older. This eventual consistency model does not require
a server side persistent datastore.

Endpoints:
/light - IOT state server for lights in the house.
