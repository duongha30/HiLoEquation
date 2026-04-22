'use strict';

require('dotenv/config');
const express = require('express');
const app = express();
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routers = require('./routes/index');
const swaggerUI = require('swagger-ui-express');
const swaggerSpec = require('./utils/swagger');

// init middlewares
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

// init db
require('./dbs/init.db');
// const { checkOverLoad } = require('./helpers/check.connect');
// checkOverLoad();

//routes
app.use('/', routers);

// handling error
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});
app.use((error, req, res, next) => {
  const statusCode = error.status || 500;
  return res.status(statusCode).json({
    status: 'Error',
    code: statusCode,
    message: error.message || 'Internal Server Error'
  });
});
module.exports = app;