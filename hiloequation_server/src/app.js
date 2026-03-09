import 'dotenv/config';
import express from 'express';
const app = express();
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';

// init middlewares
app.use(morgan('dev'));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

// init db
// const { checkOverLoad } = require('./helpers/check.connect');
// checkOverLoad();


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
export default app;