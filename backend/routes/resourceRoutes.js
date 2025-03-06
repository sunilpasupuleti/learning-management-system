const express = require("express");
const { VerifyToken, checkRole } = require("../helpers/AuthHelpers");
const {
  superAdminRole,
  adminRole,
  validateParamsObjectId,
  userRole,
} = require("../helpers/utility");

const multer = require("multer");
const {
  getResources,
  createResources,
  removeResources,
  editResources,
} = require("../controllers/resource/resourceController");
const {
  validateCreateResources,
} = require("../controllers/resource/resourceValidator");

const router = express.Router();

let adminAndSuperAdminRoles = [superAdminRole, adminRole];

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * @swagger
 * tags:
 *   name: Resources
 *   description: API endpoints for managing resources
 */

/**
 * @swagger
 * /resource:
 *   get:
 *     summary: Get all Resources
 *     tags: [Resources]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the list of Resources
 */
router
  .route("/")
  .get(checkRole([...adminAndSuperAdminRoles, userRole]), getResources);

/**
 * @swagger
 * /resource:
 *   post:
 *     summary: Create a new resource
 *     tags: [Resources]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               resources:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Resource created successfully
 */

router
  .route("/")
  .post(
    checkRole(adminAndSuperAdminRoles),
    upload.fields([{ name: "resources", maxCount: 1000 }]),
    validateCreateResources,
    createResources
  );

/**
 * @swagger
 * /resource/remove-resources:
 *   put:
 *     summary: Remove videos from a course
 *     tags: [Resources]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Videos removed successfully
 */
router
  .route("/remove-resources")
  .put(checkRole(adminAndSuperAdminRoles), removeResources);

/**
 * @swagger
 * /resource:
 *   put:
 *     summary: Update an existing resource
 *     tags: [Resources]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               resources:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Resource updated successfully
 */

router
  .route("/")
  .put(
    checkRole(adminAndSuperAdminRoles),
    upload.fields([{ name: "resources", maxCount: 1000 }]),
    validateCreateResources,
    editResources
  );

module.exports = router;
