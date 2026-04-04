'use strict';

const express = require('express');
const roomRouter = require('./room/index');
const router = express.Router();

//check api key
// router.use(apiKey);
// //check permission
// router.use(checkApiKeyPermission('0000'));

router.use('/v1/api', roomRouter);

module.exports = router;