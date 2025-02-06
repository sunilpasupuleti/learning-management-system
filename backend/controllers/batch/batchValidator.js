const { lowercase, uppercase } = require("../../helpers/typography");
const {
  sendResponse,
  httpCodes,
  adminRole,
  trainerRole,
  userRole,
} = require("../../helpers/utility");
const Batches = require("../../models/Batches");
const Users = require("../../models/Users");
const bcrypt = require("bcrypt");

module.exports = {
  async validateCreateBatch(req, res, next) {
    const { code, name } = req.body;
    try {
      if (!code) {
        throw "Batch Code required";
      }

      if (!name) {
        throw "Batch Name required";
      }

      let batchExists;
      let mode = req.mode;
      if (mode && mode === "update") {
        let batchId = req.params.id;
        batchExists = await Batches.findOne({
          code: uppercase(code),
          _id: { $ne: batchId },
        });
      } else {
        batchExists = await Batches.findOne({
          code: uppercase(code),
        });
      }

      if (batchExists) {
        throw "Batch Code Already Exists";
      }

      next();
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e,
      });
    }
  },
};
