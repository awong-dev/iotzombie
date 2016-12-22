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

const auth = basicAuth({
  users: { 'admin': 'supersecret' },
  challenge: true
});

app.use(bodyParser.json());

app.use('/', express.static('public'));

app.use('/generated', express.static('build/generated'));

app.use('/lights', auth, lightsRouter.web);

app.use('/api/', function(req, res, next) {
  var contype = req.headers['content-type'];
  if (!contype || contype.indexOf('application/json') !== 0)
    return res.status(400).send('Requires Content-Type: application/json');
  next();
});

app.use('/api/lights', auth, lightsRouter.api);

if (module === require.main) {
  const server = app.listen(process.env.PORT || 8080, () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
}

module.exports = app;
