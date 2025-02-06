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
  updatePassword
} = require("../controllers/user/userController");
const {
  validateCreateUser,
  validateCreateUserFromCsv,
  validateUpdateUser,
  validatePassword
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

// Get User Details
router.route("/:id").get(VerifyToken, validateParamsObjectId(), getUser);

// Get Users
router
  .route("/")
  .get(VerifyToken, checkRole(adminAndSuperAdminRoles), getUsers);

// Create User
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

// Update User
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

router
  .route("/updateUserdata")
  .post(VerifyToken, checkRole([userRole]), validateUpdateUser, updateUserData);

  router
  .route("/updatePassword")
  .post(VerifyToken, checkRole([userRole]), validatePassword, updatePassword);


// delete user
router.route("/:id").delete(validateParamsObjectId(), deleteUser);

module.exports = router;
