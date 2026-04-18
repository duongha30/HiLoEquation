'use strict';

const { ERROR } = require('../socket/events');

const emitHandler = ({
    io,
    roomId,
    eventName,
    result,
    buildSuccessPayload = (value) => value,
}) => {
    if (!result) {
        io.to(roomId).emit(eventName, { status: ERROR });
        return false;
    }

    io.to(roomId).emit(eventName, buildSuccessPayload(result));
    return true;
};

module.exports = {
    emitHandler,
};