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
  getCourse,
  getCourses,
  createCourse,
  editCourse,
  deleteCourse,
  removeCourseVideos,
  removeCourseResources,
  removeSection,
} = require("../controllers/course/courseController");
const {
  validateCreateCourse,
  validateRemoveSection,
} = require("../controllers/course/courseValidator");
const multer = require("multer");

const router = express.Router();

let adminAndSuperAdminRoles = [superAdminRole, adminRole];

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: API endpoints for managing courses
 */

/**
 * @swagger
 * /course:
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the list of courses
 */
router
  .route("/")
  .get(checkRole([...adminAndSuperAdminRoles, userRole]), getCourses);

/**
 * @swagger
 * /course:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               banner:
 *                 type: string
 *                 format: binary
 *               videos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               resources:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Course created successfully
 */
router.route("/").post(
  checkRole(adminAndSuperAdminRoles),
  upload.fields([
    { name: "banner", maxCount: 1 },
    { name: "videos", maxCount: 1000 },
    { name: "resources", maxCount: 1000 },
  ]),
  validateCreateCourse,
  createCourse
);

/**
 * @swagger
 * /course/{id}:
 *   get:
 *     summary: Get course details by ID
 *     tags: [Courses]
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
 *         description: Course details retrieved
 */
router
  .route("/:id")
  .get(
    validateParamsObjectId(),
    checkRole([...adminAndSuperAdminRoles, userRole]),
    getCourse
  );

/**
 * @swagger
 * /course/{id}:
 *   put:
 *     summary: Update an existing course
 *     tags: [Courses]
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
 *               banner:
 *                 type: string
 *                 format: binary
 *               videos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               resources:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Course updated successfully
 */
router.route("/:id").put(
  (req, res, next) => {
    req.mode = "update";
    next();
  },
  checkRole(adminAndSuperAdminRoles),
  validateParamsObjectId(),
  upload.fields([
    { name: "banner", maxCount: 1 },
    { name: "videos", maxCount: 1000 },
    { name: "resources", maxCount: 1000 },
  ]),
  validateCreateCourse,
  editCourse
);

/**
 * @swagger
 * /course/{id}/remove-videos:
 *   put:
 *     summary: Remove videos from a course
 *     tags: [Courses]
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
 *         description: Videos removed successfully
 */
router
  .route("/:id/remove-videos")
  .put(
    checkRole(adminAndSuperAdminRoles),
    validateParamsObjectId(),
    removeCourseVideos
  );

/**
 * @swagger
 * /course/{id}/remove-resources:
 *   put:
 *     summary: Remove resources from a course
 *     tags: [Courses]
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
 *         description: Resources removed successfully
 */
router
  .route("/:id/remove-resources")
  .put(
    checkRole(adminAndSuperAdminRoles),
    validateParamsObjectId(),
    removeCourseResources
  );

/**
 * @swagger
 * /course/{id}/remove-section:
 *   put:
 *     summary: Remove a section from a course
 *     tags: [Courses]
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
 *         description: Section removed successfully
 */
router
  .route("/:id/remove-section")
  .put(
    checkRole(adminAndSuperAdminRoles),
    validateParamsObjectId(),
    validateRemoveSection,
    removeSection
  );

/**
 * @swagger
 * /course/{id}:
 *   delete:
 *     summary: Delete a course
 *     tags: [Courses]
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
 *         description: Course deleted successfully
 */
router.route("/:id").delete(validateParamsObjectId(), deleteCourse);

module.exports = router;
