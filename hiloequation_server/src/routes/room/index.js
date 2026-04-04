'use strict';

const express = require('express');
const roomController = require('../../controllers/room.controller');
const { asyncHandler } = require('../../helpers/asyncHandler');

const router = express.Router();

router.post('', asyncHandler(roomController.createRoom));

module.exports = router;