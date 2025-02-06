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

// Get Students and trainers
router
  .route("/students-trainers")
  .get(
    checkRole([...adminAndSuperAdminRoles, trainerRole]),
    getStudensAndTrainersByBatch
  );

updateStudentsTrainers;

// Get batch Details
router.route("/:id").get(validateParamsObjectId(), getBatch);

// Get batches
router.route("/").get(getBatches);

// create Batch
router.route("/").post(validateCreateBatch, createBatch);

// update student trainers
router
  .route("/:id/students-trainers")
  .put(validateParamsObjectId(), updateStudentsTrainers);

// update batch
router.route("/:id").put(
  (req, res, next) => {
    req.mode = "update";
    next();
  },
  validateParamsObjectId(),
  validateCreateBatch,
  editBatch
);

// delete batch
router.route("/:id").delete(validateParamsObjectId(), deleteBatch);

module.exports = router;
