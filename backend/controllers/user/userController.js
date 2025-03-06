const {
  sendResponse,
  httpCodes,
  superAdminRole,
  adminRole,
  trainerRole,
  userRole,
  getObjectId,
} = require("../../helpers/utility");
const Users = require("../../models/Users");
const { lowercase, capitalize } = require("../../helpers/typography");
const bcrypt = require("bcrypt");
const Batches = require("../../models/Batches");
const _ = require("lodash");

module.exports = {
  async getUser(req, res) {
    let { id } = req.params;
    const data = await Users.findOne({
      _id: id,
    }).populate("batches");

    return sendResponse(res, httpCodes.OK, {
      message: "User Details",
      user: data,
    });
  },

  async getUsers(req, res) {
    let { page, limit, searchKeyword } = req.query;
    let currentRole = req.user.role;
    let excludedRoles = [];
    let excludedIds = [];
    if (currentRole === adminRole) {
      excludedRoles.push(superAdminRole, adminRole);
      excludedIds.push(req.user._id);
    }
    let query = {
      role: { $nin: excludedRoles },
      _id: { $nin: excludedIds },
    };
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    if (searchKeyword) {
      query.$or = [
        {
          firstName: { $regex: searchKeyword, $options: "i" },
        },
        {
          lastName: { $regex: searchKeyword, $options: "i" },
        },
        {
          email: { $regex: searchKeyword, $options: "i" },
        },
      ];
    }

    const startIndex = (page - 1) * limit;
    const totalUsers = await Users.countDocuments(query);

    const users = await Users.find(query)
      .populate("batches")
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .skip(startIndex);

    return sendResponse(res, httpCodes.OK, {
      message: "User Details",
      users: users,
      currentPage: page,
      totalUsers: totalUsers,
    });
  },

  async createUser(req, res) {
    try {
      let { email, password, firstName, lastName, role, batches } = req.body;
      email = lowercase(email);
      let hashedPassword = await bcrypt.hash(password, 10);
      let data = {
        email: email,
        firstName: capitalize(firstName),
        lastName: capitalize(lastName),
        password: hashedPassword,
        role: role,
        verified: true,
        batches: batches,
      };

      let createdUser = await Users.create(data);
      // Update batches with the created user
      if (batches.length > 0 && [trainerRole, userRole].includes(role)) {
        const data = {
          [role === userRole ? "students" : "trainers"]: createdUser._id,
        };
        await Batches.updateMany(
          { _id: { $in: batches } },
          { $addToSet: data }
        );
      } else {
        data.batches = [];
      }

      return sendResponse(res, httpCodes.OK, {
        message: "User Created Successfully",
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async createUsersFromCsv(req, res) {
    try {
      let rows = req.rows;
      const batchCodes = _.uniq(_.map(rows, (row) => _.toUpper(row.code)));
      const batches = await Batches.find({ code: { $in: batchCodes } });
      const batchMap = _.keyBy(batches, "code");

      // Find existing users by email in one query
      const emails = _.map(rows, (row) => _.toLower(row.email));
      const existingUsers = await Users.find({ email: { $in: emails } });
      const userByEmail = _.keyBy(existingUsers, "email");
      let count = 0;
      for (const row of rows) {
        let { code, firstName, lastName, email, password } = row;
        if (!code || !firstName || !lastName || !email || !password) {
          continue;
        }
        email = _.toLower(email);
        code = _.toUpper(code);
        firstName = _.capitalize(firstName);
        lastName = _.capitalize(lastName);
        let hashedPassword = await bcrypt.hash(password, 10);
        const batch = batchMap[code];
        if (!batch) {
          // Handle case where batch doesn't exist
          console.log(`Batch ${code} does not exist.`);
          continue; // Skip to the next row
        }
        let user = userByEmail[email];

        if (user) {
          // User exists, update
          _.assign(user, {
            firstName: firstName,
            lastName: lastName,
            password: hashedPassword,
            verified: true,
            batches: [batch._id], // Resetting batches to only this batch
          });
          // Remove user from all previous batches
          await Batches.updateMany(
            { students: user._id },
            { $pull: { students: user._id } }
          );

          await user.save();
        } else {
          // Create new user
          user = await Users.create({
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: hashedPassword,
            verified: true,
            batches: [batch._id],
          });
          batch.students.push(user._id);
          await batch.save();
        }
        count++;
      }

      return sendResponse(res, httpCodes.OK, {
        message: `${count} Users Uploaded Successfully`,
      });

      // first process
      // for (const row of rows) {
      //   let { code, firstName, lastName, email, password } = row;
      //   email = _.toLower(email);
      //   code = _.toUpper(code);
      //   firstName = _.capitalize(firstName);
      //   lastName = _.capitalize(lastName);
      //   let hashedPassword = await bcrypt.hash(password, 10);
      //   const batch = await Batches.findOne({
      //     code: code,
      //   });
      //   if (batch) {
      //     const userExists = await Users.findOne({ email: email });
      //     if (userExists) {
      //       userExists.firstName = firstName;
      //       userExists.lastName = lastName;
      //       userExists.password = hashedPassword;
      //       userExists.verified = true;
      //       // remove user from all batches
      //       await Batches.updateMany(
      //         { students: userExists._id },
      //         { $pull: { students: userExists._id } }
      //       );
      //       userExists.batches = [];
      //       userExists.batches.push(batch._id);
      //       await userExists.save();
      //       batch.students.push(userExists._id);
      //       await batch.save();
      //     }
      //     if (!userExists) {
      //       let data = {
      //         firstName,
      //         lastName,
      //         email,
      //         password: hashedPassword,
      //         verified: true,
      //         batches: [batch._id],
      //       };
      //       let newUser = await Users.create(data);
      //       batch.students.push(newUser._id);
      //       await batch.save();
      //     }
      //   }

      //   console.log("hello man");
      // }
      // return sendResponse(res, httpCodes.OK, {
      //   message: "Successfully uploaded students",
      // });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async editUser(req, res) {
    try {
      let { email, password, firstName, lastName, role, batches } = req.body;

      let userId = req.params.id;
      email = lowercase(email);

      let data = {
        email: email,
        firstName: capitalize(firstName),
        lastName: capitalize(lastName),
        role: role,
        batches: batches,
      };

      if (password) {
        let hashedPassword = await bcrypt.hash("Datavalley@123", 10);
        data.password = hashedPassword;
      }
      if ([superAdminRole, adminRole].includes(role)) {
        data.batches = [];
      } else {
        let userData = await Users.findOne({
          _id: userId,
        });
        let currentRole = userData.role;
        // Convert batches to strings for comparison
        let userDataBatches = userData.batches.map((batch) => batch.toString());
        // role changed
        if (role !== currentRole) {
          const roleToRemove =
            currentRole === userRole ? "students" : "trainers";
          await Batches.updateMany(
            { _id: { $in: userDataBatches } },
            { $pull: { [roleToRemove]: userId } }
          );
          // role changed and also batches
          currentRole = role;
          const roleToAdd = currentRole === userRole ? "students" : "trainers";
          await Batches.updateMany(
            { _id: { $in: batches } },
            { $addToSet: { [roleToAdd]: userId } }
          );
        }
        // Check if user's batches need to be updated
        else if (role === currentRole && !_.isEqual(userDataBatches, batches)) {
          // Remove user from batches not present in the new 'batches' array
          let batchesToRemove = _.difference(userDataBatches, batches);
          if (batchesToRemove.length > 0) {
            const updateData = {
              [currentRole === userRole ? "students" : "trainers"]: userId,
            };
            await Batches.updateMany(
              { _id: { $in: batchesToRemove } },
              {
                $pull: updateData, // Assuming it's students, change it if needed
              }
            );
          }

          // Add user to new batches
          let batchesToAdd = _.difference(batches, userDataBatches);

          if (
            batchesToAdd.length > 0 &&
            [trainerRole, userRole].includes(role)
          ) {
            const updateData = {
              [currentRole === userRole ? "students" : "trainers"]: userId,
            };
            await Batches.updateMany(
              { _id: { $in: batchesToAdd } },
              { $addToSet: updateData }
            );
          }
        }
      }

      await Users.findByIdAndUpdate(
        {
          _id: userId,
        },
        {
          $set: data,
        }
      );

      return sendResponse(res, httpCodes.OK, {
        message: "User Updated successfully",
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async deleteUser(req, res) {
    try {
      let id = req.params.id;
      await Batches.updateMany(
        {
          students: id,
        },
        {
          $pull: { students: id },
        }
      );

      // remove the quiz attempt
      await Users.deleteMany({
        user: id,
      });

      await Users.findOneAndDelete({
        _id: id,
        role: { $ne: "superAdmin" },
      });

      return sendResponse(res, httpCodes.OK, {
        message: "User Deleted successfully",
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async updateUserData(req, res) {
    try {
      const { firstName, lastName, userId } = req.body;
      const data = {
        firstName: capitalize(firstName),
        lastName: capitalize(lastName),
      };
      await Users.findByIdAndUpdate(
        {
          _id: userId,
        },
        {
          $set: data,
        }
      );
      return sendResponse(res, httpCodes.OK, {
        status: "success",
        message: "Name updated successfully",
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async updatePassword(req, res) {
    try {
      const { oldPassword, newPassword, userId } = req.body;

      const user = await Users.findOne({ _id: userId });
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

      if (!isPasswordValid) {
        return sendResponse(res, httpCodes.BAD_REQUEST, {
          message: "Incorrect password entered",
        });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await Users.findByIdAndUpdate(
        {
          _id: userId,
        },
        {
          $set: { password: hashedPassword },
        }
      );
      return sendResponse(res, httpCodes.OK, {
        status: "success",
        message: "Password updated successfully",
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },
};
