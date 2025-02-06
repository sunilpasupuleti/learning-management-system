const {
  sendResponse,
  httpCodes,
  userRole,
  trainerRole,
  superAdminRole,
  adminRole,
  getObjectId,
} = require("../../helpers/utility");
const { capitalize, uppercase } = require("../../helpers/typography");
const Batches = require("../../models/Batches");
const Users = require("../../models/Users");
const Quiz = require("../../models/Quiz");
const Courses = require("../../models/Courses");
const _ = require("lodash");

module.exports = {
  async getBatch(req, res) {
    let { id } = req.params;
    const batch = await Batches.findOne({
      _id: id,
    }).populate("students trainers");

    return sendResponse(res, httpCodes.OK, {
      message: "Batch Details",
      batch: batch,
    });
  },

  async getBatches(req, res) {
    let query = {};
    let { page, limit, searchKeyword, pagination, dropDown } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    if (searchKeyword) {
      query.$or = [
        {
          code: { $regex: searchKeyword, $options: "i" },
        },
        {
          name: { $regex: searchKeyword, $options: "i" },
        },
      ];
    }
    const startIndex = (page - 1) * limit;
    const totalBatches = await Batches.countDocuments(query);

    const queryBuilder = Batches.find(query)
      .populate("students trainers")
      .sort({
        createdAt: -1,
      });
    if (dropDown === "yes") {
      queryBuilder.select({
        _id: 1,
        name: 1,
        code: 1,
      });
    }
    if (pagination === "yes") {
      queryBuilder.limit(limit).skip(startIndex);
    }

    const batches = await queryBuilder;

    return sendResponse(res, httpCodes.OK, {
      message: "Batches Details",
      batches: batches,
      currentPage: page,
      totalBatches: totalBatches,
    });
  },

  async getStudensAndTrainersByBatch(req, res) {
    try {
      let { page, limit, searchKeyword, role, batchId, type } = req.query;
      if (!batchId) {
        throw "Invalud batch Id";
      }
      let batchIds = batchId.split(",");
      if (!batchIds || batchIds.length === 0) {
        throw "No batchids proviced";
      }

      if (!type || !["selected", "unselected"].includes(type)) {
        throw "Invalid Type";
      }
      if (!["student", "trainer"].includes(role)) {
        throw "Invalid Role";
      }
      batchIds = batchIds.map((b) => getObjectId(b));
      let batchDocuments = await Batches.find({
        _id: {
          $in: batchIds,
        },
      }).select({
        students: 1,
        trainers: 1,
      });

      let batchStudents = _.flatMap(batchDocuments, "students");
      let batchTrainers = _.flatMap(batchDocuments, "trainers");

      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;
      const startIndex = (page - 1) * limit;

      let query = {
        role: role === "student" ? userRole : trainerRole,
      };
      if (type === "selected") {
        query.batches = {
          $in: batchIds,
        };
      } else {
        query._id = {
          $nin: role === "student" ? batchStudents : batchTrainers,
        };
      }

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
        totalUsers: totalUsers,
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async createBatch(req, res) {
    try {
      let { code, name } = req.body;
      let data = {
        code: uppercase(code),
        name: capitalize(name),
      };

      let newBatch = await Batches.create(data);

      return sendResponse(res, httpCodes.OK, {
        message: "Batch added successfully",
        batch: newBatch._id,
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async editBatch(req, res) {
    try {
      let id = req.params.id;
      let batch = await Batches.findOne({
        _id: id,
      });
      if (!batch) {
        throw "no batch";
      }

      let { code, name } = req.body;
      let data = {
        code: uppercase(code),
        name: capitalize(name),
      };

      await Batches.findOneAndUpdate(
        {
          _id: id,
        },
        {
          $set: data,
        }
      );

      return sendResponse(res, httpCodes.OK, {
        message: "Batch updated successfully",
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async updateStudentsTrainers(req, res) {
    try {
      let { role, userId } = req.body;
      let id = req.params.id;
      userId = getObjectId(userId);
      id = getObjectId(id);
      // Update user

      if (role === "student" || role === "trainer") {
        const usrRole = role === "student" ? userRole : trainerRole;
        // Check if the batch already exists in the user's batches array
        const user = await Users.findOne({
          _id: userId,
          role: usrRole,
          batches: id,
        });

        if (user) {
          // Batch already exists, remove it
          await Users.findOneAndUpdate(
            {
              _id: userId,
              role: usrRole,
            },
            {
              $pull: {
                batches: id,
              },
            }
          );
        } else {
          // Batch does not exist, add it
          await Users.findOneAndUpdate(
            {
              _id: userId,
              role: usrRole,
            },
            {
              $push: {
                batches: id,
              },
            }
          );
        }
      }
      const updateField =
        role === "student"
          ? "students"
          : role === "trainer"
          ? "trainers"
          : null;

      // Check if userId already exists in the array
      const userExists = await Batches.exists({
        _id: id,
        [updateField]: userId,
      });

      // Update the students or trainers array
      const updatedBatch = await Batches.findOneAndUpdate(
        {
          _id: id,
        },
        userExists
          ? { $pull: { [updateField]: userId } }
          : { $addToSet: { [updateField]: userId } },
        {
          new: true,
        }
      );

      return sendResponse(res, httpCodes.OK, {
        message: "Updated successfully",
        batch: updatedBatch,
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async deleteBatch(req, res) {
    try {
      let id = req.params.id;

      let quizFound = await Quiz.findOne({
        batch: id,
      });

      let userFound = await Users.findOne({
        batches: id,
      });

      let courseFound = await Courses.findOne({
        batch: id,
      });

      if (userFound) {
        throw `Cannot delete batch as it is linked to user ${userFound.email}`;
      }

      if (quizFound) {
        throw `Cannot delete batch as it is linked to quiz ${quizFound.name}`;
      }

      if (quizFound) {
        throw `Cannot delete batch as it is linked to course ${courseFound.title}`;
      }

      await Batches.findOneAndDelete({
        _id: id,
      });
      return sendResponse(res, httpCodes.OK, {
        message: "Batch Deleted successfully",
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },
};
