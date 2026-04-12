const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

const definition = {
    openapi: '3.0.0',
    info: {
        title: 'HiLoEquation API',
        version: '1.0.0',
        description: 'API documentation for HiLoEquation server',
    },
    servers: [
        {
            url: 'http://localhost:4055',
        },
    ],
};

const options = {
    definition,
    apis: [path.join(__dirname, '../routes/**/*.js')],
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;