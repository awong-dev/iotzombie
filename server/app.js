'use strict';

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const basicAuth = require('express-basic-auth');
const morgan = require('morgan');
const winston = require('winston');

const app = express();

// Setup up logger.
const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      level:            'debug',
      handleExceptions: true,
      json:             false,
      colorize:         true,
      timestamp: true
    })
  ],
  exitOnError: false
});

logger.stream = {
  write: (message, encoding) => {
    logger.info(message);
  }
};

const options = {
  logger
};

const lightsRouter = require('./routes/lights')(options);
 
app.use(require("morgan")("combined", { "stream": logger.stream }));

const userAuth = basicAuth({
  users: JSON.parse(process.env.USER_AUTH || '{}'),
  challenge: true
});

const deviceAuth = basicAuth({
  users: JSON.parse(process.env.DEVICE_AUTH || '{}'),
  challenge: true
});

app.use(bodyParser.json());

app.use('/', express.static('public'));

app.use('/generated', express.static('build/generated'));

app.use('/lights', userAuth, lightsRouter.ui);

app.use('/api/', function(req, res, next) {
  var contype = req.headers['content-type'];
  if (!contype || contype.indexOf('application/json') !== 0)
    return res.status(400).send('Requires Content-Type: application/json');
  next();
});

app.use('/api/lights', deviceAuth, lightsRouter.api);

if (module === require.main) {
  const server = app.listen(process.env.PORT || 8080, () => {
    const port = server.address().port;
    logger.log(`App listening on port ${port}`);
  });
}

module.exports = app;
