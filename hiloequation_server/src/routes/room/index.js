'use strict';

const express = require('express');
const roomController = require('../../controllers/room.controller');
const { asyncHandler } = require('../../helpers/asyncHandler');
const { authentication } = require('../../auth/authUtils');

const router = express.Router();

router.use(authentication);
router.get('/room/:roomId', asyncHandler(roomController.getRoomById));
router.post('/room/create', asyncHandler(roomController.createRoom));
router.post('/room/join', asyncHandler(roomController.accessRoom));

module.exports = router;