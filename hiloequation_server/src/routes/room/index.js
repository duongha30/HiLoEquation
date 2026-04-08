'use strict';

const express = require('express');
const roomController = require('../../controllers/room.controller');
const { asyncHandler } = require('../../helpers/asyncHandler');
const { authentication } = require('../../auth/authUtils');

const router = express.Router();

// router.use(authentication);
router.post('/room/create', asyncHandler(roomController.createRoom));

module.exports = router;