const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LMS API Documentation",
      version: "1.0.0",
      description: "API documentation for Learning Management System",
    },
    servers: [
      {
        url: "http://localhost:3002", // Dev Environment
        description: "Local Development Server",
      },
      {
        url: "https://api.yourdomain.com", // Production Environment
        description: "Production Server",
      },
    ],
  },
  apis: [path.join(__dirname, "../routes/*.js")], // Scan all route files
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
module.exports = swaggerDocs;
