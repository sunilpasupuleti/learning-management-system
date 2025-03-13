const express = require("express");
const { VerifyToken, checkRole } = require("../helpers/AuthHelpers");
const {
  superAdminRole,
  adminRole,
  validateParamsObjectId,
  userRole,
  trainerRole,
} = require("../helpers/utility");

const {
  getQuiz,
  getQuizes,
  createQuiz,
  editQuiz,
  submitQuiz,
  deleteQuiz,
} = require("../controllers/quiz/quizController");
const {
  validateCreateQuiz,
  validateSubmitQuiz,
} = require("../controllers/quiz/quizValidator");

const router = express.Router();

let adminAndSuperAdminRoles = [superAdminRole, adminRole];

/**
 * @swagger
 * tags:
 *   name: Quizes
 *   description: API endpoints for managing Quizes
 */

/**
 * @swagger
 * /quiz:
 *   get:
 *     summary: Get all quizes
 *     tags: [Quizes]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the list of quizes
 */
router
  .route("/")
  .get(checkRole([...adminAndSuperAdminRoles, userRole]), getQuizes);

/**
 * @swagger
 * /quiz:
 *   post:
 *     summary: Create a new quiz
 *     tags: [Quizes]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               timeLimitEnabled:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Quiz created successfully
 */
router
  .route("/")
  .post(checkRole(adminAndSuperAdminRoles), validateCreateQuiz, createQuiz);

/**
 * @swagger
 * /quiz/submit/{id}:
 *   post:
 *     summary: Submit Quiz
 *     tags: [Quizes]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               questions:
 *                 type: array
 *     responses:
 *       200:
 *         description: Quiz submitted successfully
 */
router
  .route("/submit/:id")
  .post(checkRole([userRole]), validateSubmitQuiz, submitQuiz);

/**
 * @swagger
 * /quiz/{id}:
 *   get:
 *     summary: Get quiz details by ID
 *     tags: [Quizes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz details retrieved
 */
router
  .route("/:id")
  .get(
    validateParamsObjectId(),
    checkRole([...adminAndSuperAdminRoles, userRole]),
    getQuiz
  );

/**
 * @swagger
 * /quiz/{id}:
 *   put:
 *     summary: Update an existing quiz
 *     tags: [Quizes]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *       200:
 *         description: Quiz updated successfully
 */
router.route("/:id").put(
  (req, res, next) => {
    req.mode = "update";
    next();
  },
  checkRole(adminAndSuperAdminRoles),
  validateParamsObjectId(),
  validateCreateQuiz,
  editQuiz
);

/**
 * @swagger
 * /quiz/{id}:
 *   delete:
 *     summary: Delete a quiz
 *     tags: [Quizes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz deleted successfully
 */
router.route("/:id").delete(validateParamsObjectId(), deleteQuiz);

module.exports = router;
