const { lowercase } = require("../../helpers/typography");
const {
  sendResponse,
  httpCodes,
  adminRole,
  trainerRole,
  userRole,
} = require("../../helpers/utility");
const Users = require("../../models/Users");
const bcrypt = require("bcrypt");
const Papa = require("papaparse");
const _ = require("lodash");
const Batches = require("../../models/Batches");

module.exports = {
  async validateCreateUser(req, res, next) {
    const { email, password, firstName, lastName, role, verified } = req.body;
    let mode = req.mode;

    try {
      if (!email) {
        throw "Email required";
      }

      if (!firstName) {
        throw "First Name required";
      }

      if (!lastName) {
        throw "Last Name required";
      }

      if (!password && mode !== "update") {
        throw "Password required";
      }

      if (typeof verified !== "boolean") {
        throw "Verified mark required";
      }

      if (!role) {
        throw "Role required";
      }
      if (![adminRole, trainerRole, userRole].includes(role)) {
        throw "Invalid Role";
      }

      let userExists;
      if (mode && mode === "update") {
        let userId = req.params.id;
        userExists = await Users.findOne({
          email: lowercase(email),
          _id: { $ne: userId },
        });
      } else {
        userExists = await Users.findOne({
          email: lowercase(email),
        });
      }

      if (userExists) {
        throw "Email-Id is already registered with another account!";
      }

      next();
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e,
      });
    }
  },

  async validateUpdateUser(req, res, next) {
    const { firstName, lastName } = req.body;
    try {
      if (!firstName) {
        throw "First Name required";
      }

      if (!lastName) {
        throw "Last Name required";
      }
      next();
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e,
      });
    }
  },

  async validatePassword(req, res, next) {
    const { oldPassword, newPassword, userId } = req.body;
    try {

      if (!oldPassword) {
        throw "Password required";
      }
      if (!newPassword) {
        throw "New Password required";
      }
      next();
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e,
      });
    }
  },

  async validateCreateUserFromCsv(req, res, next) {
    try {
      let csvFile = req.files?.csv?.[0];
      if (!csvFile) {
        throw "Invalid CSV File";
      }
      let buffer = csvFile.buffer;
      let result = await Papa.parse(buffer.toString(), {
        header: true,
        skipEmptyLines: true,
      });

      const columnNames = result.meta.fields;

      let allowedColumnNames = [
        "code",
        "firstName",
        "lastName",
        "email",
        "password",
      ];
      if (!_.isEqual(columnNames, allowedColumnNames)) {
        throw "Invalid Column Names";
      }
      const rows = result.data;
      req.rows = rows;
      if (!rows || rows.length > 500) {
        throw "Only 500 Rows Per file allowed";
      }
      next();
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },
};
