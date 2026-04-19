'use strict'
const { AccessService } = require('../services/access.service')
const { OK } = require('../core/success.response')

class AccessController {
    logout = async (req, res) => {
        new OK({
            message: "Logout successfully",
            metadata: await AccessService.logout({
                keyStore: req.keyStore
            })
        }).send(res);
    }
    login = async (req, res) => {
        const result = await AccessService.login(req.body);
        AccessService.setCookies(res, result.tokens);
        new OK({
            message: "Login successfully",
            metadata: {
                user: result.user,
            }
        }).send(res);
    }
    signUp = async (req, res) => {
        const result = await AccessService.signUp(req.body);
        AccessService.setCookies(res, result.tokens);
        new OK({
            message: "Sign up new player successfully",
            metadata: {
                user: result.user,
            }
        }).send(res);
    }
}

module.exports = new AccessController();