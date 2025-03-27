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
  getReports,
  getReport,
  getQuizReport,
} = require("../controllers/report/reportController");

const router = express.Router();

let adminAndSuperAdminRoles = [superAdminRole, adminRole];

// // Get Quiz Details
// router
//   .route("/:id")
//   .get(
//     validateParamsObjectId(),
//     checkRole([...adminAndSuperAdminRoles, userRole]),
//     getQuiz
//   );

// Get Reports
router
  .route("/")
  .get(
    checkRole([...adminAndSuperAdminRoles, userRole, trainerRole]),
    getReports
  );

// Get Quiz Reports
router
  .route("/quiz/:id")
  .get(
    checkRole([...adminAndSuperAdminRoles, trainerRole]),
    validateParamsObjectId(),
    getQuizReport
  );

//   get report
router
  .route("/:id")
  .get(
    checkRole([...adminAndSuperAdminRoles, userRole]),
    validateParamsObjectId(),
    getReport
  );

// update quiz
// router.route("/:id").put(
//   (req, res, next) => {
//     req.mode = "update";
//     next();
//   },
//   checkRole(adminAndSuperAdminRoles),
//   validateParamsObjectId(),
//   validateCreateQuiz,
//   editQuiz
// );

module.exports = router;
