const express = require("express");
const { VerifyToken, checkRole } = require("../helpers/AuthHelpers");
const {
  getUser,
  createUser,
  getUsers,
  editUser,
  deleteUser,
  createUsersFromCsv,
  updateUserData,
  updatePassword,
} = require("../controllers/user/userController");
const {
  validateCreateUser,
  validateCreateUserFromCsv,
  validateUpdateUser,
  validatePassword,
} = require("../controllers/user/userValidator");
const {
  superAdminRole,
  adminRole,
  validateParamsObjectId,
  userRole,
} = require("../helpers/utility");
const multer = require("multer");

const router = express.Router();

let adminAndSuperAdminRoles = [superAdminRole, adminRole];

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Get user details by ID
 *     tags:
 *       - User Management
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
 *         description: Successfully retrieved user details
 *       404:
 *         description: User not found
 */
router.route("/:id").get(VerifyToken, validateParamsObjectId(), getUser);

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Get list of all users
 *     tags:
 *       - User Management
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved users
 *       403:
 *         description: Unauthorized access
 */
router
  .route("/")
  .get(VerifyToken, checkRole(adminAndSuperAdminRoles), getUsers);

/**
 * @swagger
 * /user:
 *   post:
 *     summary: Create a new user
 *     tags:
 *       - User Management
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               verified:
 *                 type: boolean
 *               role:
 *                 type: string
 *                 enum: [admin, superadmin, trainer, student]
 *     responses:
 *       200:
 *         description: User successfully created
 *       400:
 *         description: Invalid request data
 */
router
  .route("/")
  .post(
    VerifyToken,
    checkRole(adminAndSuperAdminRoles),
    validateCreateUser,
    createUser
  );

router
  .route("/csv")
  .post(
    VerifyToken,
    checkRole(adminAndSuperAdminRoles),
    upload.fields([{ name: "csv", maxCount: 1 }]),
    validateCreateUserFromCsv,
    createUsersFromCsv
  );

/**
 * @swagger
 * /user/{id}:
 *   put:
 *     summary: Update user details
 *     tags:
 *       - User Management
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, superadmin, trainer, student]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: User not found
 */
router.route("/:id").put(
  VerifyToken,
  checkRole(adminAndSuperAdminRoles),
  (req, res, next) => {
    req.mode = "update";
    next();
  },
  validateCreateUser,
  editUser
);

/**
 * @swagger
 * /user/updateUserdata:
 *   post:
 *     summary: Update user profile data
 *     tags:
 *       - User Management
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       200:
 *         description: User data updated successfully
 *       400:
 *         description: Invalid request data
 */
router
  .route("/updateUserdata")
  .post(VerifyToken, checkRole([userRole]), validateUpdateUser, updateUserData);

/**
 * @swagger
 * /user/updatePassword:
 *   post:
 *     summary: Update user password
 *     tags:
 *       - User Management
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid request data
 */
router
  .route("/updatePassword")
  .post(VerifyToken, checkRole([userRole]), validatePassword, updatePassword);

/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags:
 *       - User Management
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
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.route("/:id").delete(validateParamsObjectId(), deleteUser);

module.exports = router;
