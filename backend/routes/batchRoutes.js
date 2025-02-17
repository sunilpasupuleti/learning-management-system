const express = require("express");
const { VerifyToken, checkRole } = require("../helpers/AuthHelpers");
const {
  superAdminRole,
  adminRole,
  validateParamsObjectId,
  trainerRole,
} = require("../helpers/utility");
const {
  getBatch,
  getBatches,
  editBatch,
  createBatch,
  deleteBatch,
  getStudensAndTrainersByBatch,
  updateStudentsTrainers,
} = require("../controllers/batch/batchController");
const { validateCreateBatch } = require("../controllers/batch/batchValidator");

const router = express.Router();

let adminAndSuperAdminRoles = [superAdminRole, adminRole];

/**
 * @swagger
 * /batch/students-trainers:
 *   get:
 *     summary: Get students and trainers assigned to batches
 *     tags:
 *       - Batch Management
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved students and trainers list
 *       403:
 *         description: Unauthorized access
 */
router
  .route("/students-trainers")
  .get(
    checkRole([...adminAndSuperAdminRoles, trainerRole]),
    getStudensAndTrainersByBatch
  );

updateStudentsTrainers;

/**
 * @swagger
 * /batch/{id}:
 *   get:
 *     summary: Get batch details by ID
 *     tags:
 *       - Batch Management
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Batch details retrieved successfully
 *       404:
 *         description: Batch not found
 */
router.route("/:id").get(validateParamsObjectId(), getBatch);

/**
 * @swagger
 * /batch:
 *   get:
 *     summary: Get all batches
 *     tags:
 *       - Batch Management
 *     responses:
 *       200:
 *         description: Successfully retrieved batch list
 *       403:
 *         description: Unauthorized access
 */
router.route("/").get(getBatches);

/**
 * @swagger
 * /batch:
 *   post:
 *     summary: Create a new batch
 *     tags:
 *       - Batch Management
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Batch created successfully
 *       400:
 *         description: Invalid input data
 */

router.route("/").post(validateCreateBatch, createBatch);

/**
 * @swagger
 * /batch/{id}/students-trainers:
 *   put:
 *     summary: Update students and trainers assigned to a batch
 *     tags:
 *       - Batch Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Batch students and trainers updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Batch not found
 */
router
  .route("/:id/students-trainers")
  .put(validateParamsObjectId(), updateStudentsTrainers);

/**
 * @swagger
 * /batch/{id}:
 *   put:
 *     summary: Update batch details
 *     tags:
 *       - Batch Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Batch updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Batch not found
 */
router.route("/:id").put(
  (req, res, next) => {
    req.mode = "update";
    next();
  },
  validateParamsObjectId(),
  validateCreateBatch,
  editBatch
);

/**
 * @swagger
 * /batch/{id}:
 *   delete:
 *     summary: Delete a batch
 *     tags:
 *       - Batch Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Batch deleted successfully
 *       404:
 *         description: Batch not found
 */
router.route("/:id").delete(validateParamsObjectId(), deleteBatch);

module.exports = router;
