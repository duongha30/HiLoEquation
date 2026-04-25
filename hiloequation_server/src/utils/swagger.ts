import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';

const definition = {
    openapi: '3.0.0',
    info: {
        title: 'HiLoEquation API',
        version: '1.0.0',
        description: 'API documentation for HiLoEquation server',
    },
    servers: [{ url: 'http://localhost:4055' }],
};

const options: swaggerJSDoc.Options = {
    definition,
    apis: [path.join(__dirname, '../routes/**/*.ts')],
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
