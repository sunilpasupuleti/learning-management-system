const {
  sendResponse,
  httpCodes,
  userRole,
  superAdminRole,
  adminRole,
  getObjectId,
  trainerRole,
} = require("../../helpers/utility");
const { capitalize, uppercase } = require("../../helpers/typography");
const QuizAttempt = require("../../models/QuizAttempt");
const _ = require("lodash");
const Users = require("../../models/Users");
const Batches = require("../../models/Batches");

module.exports = {
  async getReports(req, res) {
    try {
      let user = req.user;
      let role = user.role;
      let { page, limit, searchKeyword, reportsBy } = req.query;
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;
      let matchQuery = {};
      if (role === userRole) {
        matchQuery = {
          user: getObjectId(user._id),
        };
      } else if (role === trainerRole && reportsBy === "quiz") {
        throw "You are unable to view the data";
      } else if (role === trainerRole && reportsBy === "batches") {
        user = await Users.findOne({
          _id: user._id,
        });
      }
      if (searchKeyword) {
        if (reportsBy === "quiz") {
          matchQuery.$or = [
            {
              "quiz.name": { $regex: searchKeyword, $options: "i" },
            },
          ];
        }
      }
      const startIndex = (page - 1) * limit;
      let aggregationPipeline;
      if (reportsBy === "quiz") {
        if (role === userRole) {
          aggregationPipeline = [
            {
              $match: matchQuery,
            },
            {
              $facet: {
                reports: [
                  {
                    $sort: {
                      createdAt: -1,
                    },
                  },
                ],
              },
            },
          ];
        } else {
          aggregationPipeline = [
            {
              $match: matchQuery,
            },
            {
              $group: {
                _id: "$quiz._id",
                name: { $first: "$quiz.name" },
                createdAt: { $first: "$quiz.createdAt" },
                totalAttempts: { $sum: 1 },
                totalPassAttempts: {
                  $sum: { $cond: [{ $eq: ["$result", "pass"] }, 1, 0] },
                },
                totalFailAttempts: {
                  $sum: {
                    $cond: [{ $eq: ["$result", "fail"] }, 1, 0],
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                createdAt: 1,
                totalAttempts: 1,
                totalPassAttempts: 1,
                totalFailAttempts: 1,
                passPercentage: {
                  $round: [
                    {
                      $multiply: [
                        {
                          $divide: ["$totalPassAttempts", "$totalAttempts"],
                        },
                        100,
                      ],
                    },
                    2,
                  ],
                },
                failPercentage: {
                  $round: [
                    {
                      $multiply: [
                        {
                          $divide: ["$totalFailAttempts", "$totalAttempts"],
                        },
                        100,
                      ],
                    },
                    2,
                  ],
                },
              },
            },
            {
              $facet: {
                reports: [
                  {
                    $sort: {
                      createdAt: -1,
                    },
                  },
                  {
                    $skip: startIndex,
                  },
                  { $limit: limit },
                ],
                totalCount: [{ $count: "total" }],
              },
            },
          ];
        }
      } else {
        aggregationPipeline = [
          {
            $unwind: "$students",
          },
          {
            $lookup: {
              from: "users",
              localField: "students",
              foreignField: "_id",
              as: "studentDetails",
            },
          },
          {
            $unwind: "$studentDetails",
          },
          {
            $lookup: {
              from: "quizattempts",
              localField: "studentDetails._id",
              foreignField: "user",
              as: "quizAttempts",
            },
          },
          {
            $unwind: "$quizAttempts",
          },
          {
            $group: {
              _id: "$_id",
              name: { $first: "$name" },
              createdAt: { $first: "$createdAt" },
              totalAttempts: { $sum: 1 },
              totalPassAttempts: {
                $sum: {
                  $cond: [{ $eq: ["$quizAttempts.result", "pass"] }, 1, 0],
                },
              },
              totalFailAttempts: {
                $sum: {
                  $cond: [{ $eq: ["$quizAttempts.result", "fail"] }, 1, 0],
                },
              },
            },
          },
          {
            $match: {
              totalAttempts: { $gt: 0 },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              createdAt: 1,
              totalAttempts: 1,
              totalPassAttempts: 1,
              totalFailAttempts: 1,
              passPercentage: {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: ["$totalPassAttempts", "$totalAttempts"],
                      },
                      100,
                    ],
                  },
                  2,
                ],
              },
              failPercentage: {
                $cond: [
                  { gt: ["$totalAttempts", 0] },
                  {
                    $round: [
                      {
                        $multiply: [
                          {
                            $divide: ["$totalFailAttempts", "$totalAttempts"],
                          },
                          100,
                        ],
                      },
                      2,
                    ],
                  },
                  0,
                ],
              },
            },
          },
          {
            $facet: {
              reports: [
                {
                  $sort: {
                    createdAt: -1,
                  },
                },
                {
                  $skip: startIndex,
                },
                { $limit: limit },
              ],
              totalCount: [{ $count: "total" }],
            },
          },
        ];
        if (searchKeyword) {
          aggregationPipeline.splice(-2, 0, {
            $match: {
              $or: [
                {
                  name: { $regex: searchKeyword, $options: "i" },
                },
              ],
            },
          });
        }
        if (role === trainerRole) {
          aggregationPipeline.splice(4, 0, {
            $match: {
              trainers: user._id,
            },
          });
        }
      }
      let pipelineSchema = reportsBy === "quiz" ? QuizAttempt : Batches;
      const [result] = await pipelineSchema.aggregate(aggregationPipeline);
      const reports = result.reports || [];
      const totalReports =
        result.totalCount && result.totalCount[0]
          ? result.totalCount[0].total
          : 0;
      return sendResponse(res, httpCodes.OK, {
        message: "Reports",
        reports: reports,
        totalReports: totalReports,
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async getReport(req, res) {
    let reportId = req.params.id;

    const quizAttempt = await QuizAttempt.findOne({
      _id: reportId,
    }).sort({
      createdAt: -1,
    });
    return sendResponse(res, httpCodes.OK, {
      message: "Report Details",
      report: quizAttempt,
    });
  },

  async getQuizReport(req, res) {
    try {
      let id = req.params.id;
      id = getObjectId(id);
      let user = req.user;
      let { page, limit, searchKeyword, reportsBy, filterByResult } = req.query;
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;
      const startIndex = (page - 1) * limit;

      let allStudentIds;
      let aggregationPipeline;
      let matchQuery = {};
      reportsBy === "quiz" ? (matchQuery["quiz._id"] = id) : null;
      if (filterByResult) {
        matchQuery.result = filterByResult;
      }

      let commonAggregationPipelins = [
        {
          $match: matchQuery,
        },
        // sort
        {
          $sort: {
            createdAt: -1,
          },
        },
        //  lookup users
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        // unwind userdetails
        {
          $unwind: "$userDetails",
        },

        // unset user
        {
          $unset: "user",
        },
        // add userdetails to user
        {
          $addFields: {
            user: "$userDetails",
          },
        },
        // lookup userdetails.batches
        {
          $lookup: {
            from: "batches",
            localField: "userDetails.batches",
            foreignField: "_id",
            as: "batchDetails",
          },
        },
        // unset batchdetails
        {
          $unset: "batches",
        },
        // add batchdetails to user.batches
        {
          $addFields: {
            "user.batches": "$batchDetails",
          },
        },
        // unset batchdetails , userdetails
        {
          $unset: ["batchDetails", "userDetails"],
        },
        // group by quiz name
        {
          $group: {
            _id: "$quiz.name",
            attempts: { $push: "$$ROOT" },
            totalCount: { $sum: 1 },
          },
        },
        // project
        {
          $project: {
            _id: 0,
            report: {
              name: "$_id",
              attempts: "$attempts",
              totalCount: "$totalCount",
            },
          },
        },
        // unwind report.attemps
        {
          $unwind: "$report.attempts",
        },
        // paginatioon
        {
          $skip: startIndex,
        },
        {
          $limit: limit,
        },
        // group
        {
          $group: {
            _id: "$_id",
            name: { $first: "$report.name" },
            attempts: { $push: "$report.attempts" },
            totalCount: { $first: "$report.totalCount" },
          },
        },
        // final
        {
          $project: {
            _id: 0,
            report: {
              name: "$name",
              attempts: "$attempts",
            },
            totalCount: "$totalCount",
          },
        },
      ];

      if (searchKeyword) {
        aggregationPipeline.splice(4, 0, {
          $match: {
            $or: [
              {
                "userDetails.firstName": {
                  $regex: searchKeyword,
                  $options: "i",
                },
              },
              {
                "userDetails.lastName": {
                  $regex: searchKeyword,
                  $options: "i",
                },
              },
              {
                "userDetails.email": { $regex: searchKeyword, $options: "i" },
              },
            ],
          },
        });
      }

      if (reportsBy === "quiz") {
        // Needed in future if report by quiz enabled for trainer
        // if ([trainerRole].includes(user.role)) {
        //   user = await Users.findOne({
        //     _id: user._id,
        //   }).populate("batches");
        //   let batches = user.batches;
        //   // Extract all student IDs into one array
        //   allStudentIds = batches.flatMap((batch) =>
        //     batch.students.map((student) => student)
        //   );
        //   matchQuery.user = { $in: allStudentIds };
        // }
      } else {
        commonAggregationPipelins.splice(4, 1, {
          $match: {
            "userDetails.batches": id,
          },
        });
      }

      aggregationPipeline = commonAggregationPipelins;

      let [result] = await QuizAttempt.aggregate(aggregationPipeline);
      const report = result?.report;
      const totalAttempts = result?.totalCount ? result.totalCount : 0;
      return sendResponse(res, httpCodes.OK, {
        message: "Report Details",
        report: report,
        totalAttempts: totalAttempts,
      });
    } catch (e) {
      console.log(e);
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },
};
