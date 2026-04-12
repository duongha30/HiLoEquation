'use strict';

const express = require('express');
const accessController = require('../../controllers/access.controller');
const { asyncHandler } = require('../../helpers/asyncHandler');
const { authentication } = require('../../auth/authUtils');

const router = express.Router();

/**
 * @openapi
 * /v1/api/signup:
 *   post:
 *     tags:
 *       - Access
 *     summary: Register a new player
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: secret123
 *     responses:
 *       200:
 *         description: Signup successful
 */
router.post('/signup', asyncHandler(accessController.signUp));

/**
 * @openapi
 * /v1/api/login:
 *   post:
 *     tags:
 *       - Access
 *     summary: Login player
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: secret123
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', asyncHandler(accessController.login));

router.use(authentication);
router.post('/logout', asyncHandler(accessController.logout))

module.exports = router;