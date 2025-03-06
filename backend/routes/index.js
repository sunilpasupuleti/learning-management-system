const express = require("express");
const { checkRole, VerifyToken } = require("../helpers/AuthHelpers");
const { superAdminRole, adminRole } = require("../helpers/utility");

let adminAndSuperAdminRoles = [superAdminRole, adminRole];

const router = express.Router();

// auth routes
router.use("/auth", require("./authRoutes"));

// user routes
router.use("/user", require("./userRoutes"));

// Batch Routes
router.use(
  "/batch",
  VerifyToken,
  checkRole(adminAndSuperAdminRoles),
  require("./batchRoutes")
);

// Course Routes

router.use("/course", VerifyToken, require("./courseRoutes"));
// Resource Routes
router.use("/resource", VerifyToken, require("./resourceRoutes"));

module.exports = router;
