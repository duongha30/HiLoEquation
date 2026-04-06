'use strict'
const { AccessService } = require('../services/access.service')
const { OK } = require('../core/success.response')

class AccessController {
    signUp = async (req, res) => {
        new OK({
            message: "Sign up new player successfully",
            metadata: await AccessService.signUp(req.body)
        }).send(res);
    }
}

module.exports = new AccessController();