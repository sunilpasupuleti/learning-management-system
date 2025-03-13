const {
  sendResponse,
  httpCodes,
  userRole,
  getObjectId,
  trainerRole,
} = require("../../helpers/utility");
const { capitalize, uppercase } = require("../../helpers/typography");
const Quiz = require("../../models/Quiz");
const _ = require("lodash");
const QuizAttempt = require("../../models/QuizAttempt");
const Users = require("../../models/Users");
const Batches = require("../../models/Batches");

module.exports = {
  async getQuiz(req, res) {
    let { id } = req.params;
    let user = req.user;
    let role = user.role;
    let quiz;
    id = getObjectId(id);
    if (role === userRole) {
      let fieldsToExtract = [
        "name",
        "description",
        "totalMarks",
        "singleQuestionMarks",
        "passPercentage",
        "timeLimitEnabled",
        "timeLimit",
        "attemptsEnabled",
        "attempts",
        "questions",
      ];
      quiz = await Quiz.findOne({
        _id: id,
      }).select(fieldsToExtract.join(" "));
      let attemptsCount = await QuizAttempt.countDocuments({
        "quiz._id": id,
        user: user._id,
      });
      quiz = { ...quiz.toObject(), attemptsCount };
    } else {
      quiz = await Quiz.findOne({
        _id: id,
      }).populate("batches");
    }

    return sendResponse(res, httpCodes.OK, {
      message: "Quiz Details",
      quiz: quiz,
    });
  },

  async submitQuiz(req, res) {
    try {
      let quizId = req.params.id;
      let user = req.user;
      let { timeSpentInSeconds, questions } = req.body;
      let quiz = await Quiz.findOne({
        _id: quizId,
      });
      let { singleQuestionMarks, totalMarks, passPercentage } = quiz;
      let marksObtained = 0;
      let correctAnswers = 0;
      let incorrectAnswers = 0;
      let unattemptedAnswers = 0;
      let reviewMarkedAnswers = 0;

      let structuredAnswers = [];
      questions.forEach((q) => {
        let { _id, selectedOption, selectedOptions, reviewMarked } = q;

        let question = quiz.questions.find((qs) => qs._id.toString() === _id);
        let { questionType, options } = question;

        let obj = {
          questionId: _id,
          questionType: questionType,
          reviewMarked: reviewMarked || false,
        };

        if (questionType === "single_option") {
          obj.selectedOption = selectedOption;
          let isCorrect = _.some(options, {
            optionText: selectedOption,
            isCorrect: true,
          });
          obj.isCorrect = isCorrect;
        } else {
          obj.selectedOptions = selectedOptions;
          selectedOptions = _.map(selectedOptions, _.toLower);
          if (selectedOptions.length > 0) {
            let correctOptions = _.chain(options)
              .filter("isCorrect")
              .map((option) => _.toLower(option.optionText))
              .value();
            let isCorrect = false;
            if (questionType === "multiple_options") {
              isCorrect = _.isEqual(
                _.sortBy(correctOptions),
                _.sortBy(selectedOptions)
              );
            } else {
              let checkFun = (arr1, arr2) => {
                return (
                  arr1.length === arr2.length &&
                  _.every(arr1, (value, index) => _.isEqual(value, arr2[index]))
                );
              };
              isCorrect = checkFun(correctOptions, selectedOptions);
            }

            obj.isCorrect = isCorrect;
          } else {
            obj.isCorrect = false;
          }
        }
        structuredAnswers.push(obj);
      });

      structuredAnswers.forEach((answer) => {
        let {
          isCorrect,
          questionType,
          selectedOption,
          selectedOptions,
          reviewMarked,
        } = answer;
        answer.unattempted = false;
        if (reviewMarked) {
          reviewMarkedAnswers++;
        }
        if (isCorrect) {
          marksObtained += singleQuestionMarks;
        }
        if (questionType === "single_option") {
          if (!selectedOption) {
            answer.unattempted = true;
            unattemptedAnswers++;
          } else if (selectedOption && isCorrect) {
            correctAnswers++;
          } else if (selectedOption && !isCorrect) {
            incorrectAnswers++;
          }
        } else if (
          ["multiple_options", "fill_in_the_blank"].includes(questionType)
        ) {
          if (!selectedOptions || selectedOptions.length === 0) {
            answer.unattempted = true;
            unattemptedAnswers++;
          } else if (selectedOptions && isCorrect) {
            correctAnswers++;
          } else if (selectedOptions && !isCorrect) {
            incorrectAnswers++;
          }
        }
      });

      let data = {
        quiz: quiz,
        user: user._id,
        marksObtained: marksObtained,
        correctAnswers: correctAnswers,
        incorrectAnswers: incorrectAnswers,
        unattemptedAnswers: unattemptedAnswers,
        reviewMarkedAnswers: reviewMarkedAnswers,
        timeSpentInSeconds: timeSpentInSeconds,
        answers: structuredAnswers,
        submittedOn: new Date(),
      };
      const percentage = (marksObtained / totalMarks) * 100;
      const isPass = percentage >= passPercentage;

      data.percentage = Number(percentage.toFixed(2));
      data.result = isPass ? "pass" : "fail";

      let quizAttempt = await QuizAttempt.create(data);

      let updatedQuiz = await Quiz.findOneAndUpdate(
        {
          _id: quizId,
        },
        {
          $push: {
            quizAttempts: quizAttempt._id,
          },
        }
      );

      let updatedUser = await Users.findOneAndUpdate(
        {
          _id: user._id,
        },
        {
          $push: {
            quizAttempts: quizAttempt._id,
          },
        }
      );

      return sendResponse(res, httpCodes.OK, {
        message: "Quiz Submitted Successfully",
        quizAttemptId: quizAttempt._id,
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async getQuizes(req, res) {
    let user = req.user;
    let role = user.role;
    let query = {};
    user = await Users.findOne({
      _id: user._id,
    });
    if (role === userRole) {
      query = {
        availableUntil: { $gte: new Date() },
        $or: [
          { availableToEveryone: true },
          {
            availableToEveryone: false,
            batches: { $in: user.batches },
          },
        ],
      };
    }

    let { page, limit, searchKeyword } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    if (searchKeyword) {
      query.$or = [
        {
          name: { $regex: searchKeyword, $options: "i" },
        },
      ];
    }
    const startIndex = (page - 1) * limit;
    const totalQuizes = await Quiz.countDocuments(query);

    const quizes = await Quiz.find(query)
      .populate("batches")
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .skip(startIndex);

    return sendResponse(res, httpCodes.OK, {
      message: "Quizes Details",
      quizes: quizes,
      totalQuizes: totalQuizes,
    });
  },

  async createQuiz(req, res) {
    try {
      const {
        name,
        description,
        totalMarks,
        singleQuestionMarks,
        availableFrom,
        availableUntil,
        timeLimit,
        availableToEveryone,
        timeLimitEnabled,
        passPercentage,
        questions,
        attempts,
        batches,
        dueDate,
        attemptsEnabled,
      } = req.body;

      let data = {
        name: name,
        timeLimitEnabled: timeLimitEnabled,
        attemptsEnabled: attemptsEnabled,
        passPercentage: passPercentage,
        description: description,
        totalMarks: totalMarks,
        singleQuestionMarks: singleQuestionMarks,
        availableFrom: availableFrom,
        availableUntil: availableUntil,
        batches: [],
        timeLimit: timeLimit,
        attempts: attempts,
        availableToEveryone: availableToEveryone,
        questions: questions,
      };

      if (!availableToEveryone) {
        data.batches = batches;
      }

      if (dueDate) {
        data.dueDate = dueDate;
      }
      await Quiz.create(data);
      return sendResponse(res, httpCodes.OK, {
        message: "Quiz added successfully",
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async editQuiz(req, res) {
    try {
      let id = req.params.id;
      const {
        name,
        description,
        totalMarks,
        singleQuestionMarks,
        availableFrom,
        availableUntil,
        timeLimit,
        attempts,
        availableToEveryone,
        timeLimitEnabled,
        attemptsEnabled,
        passPercentage,
        batches,
        questions,
        dueDate,
      } = req.body;

      let data = {
        name: name,
        timeLimitEnabled: timeLimitEnabled,
        attemptsEnabled: attemptsEnabled,
        passPercentage: passPercentage,
        description: description,
        totalMarks: totalMarks,
        batches: [],
        singleQuestionMarks: singleQuestionMarks,
        availableFrom: availableFrom,
        availableUntil: availableUntil,
        timeLimit: timeLimit,
        attempts: attempts,
        availableToEveryone: availableToEveryone,
        questions: questions,
      };

      if (!availableToEveryone) {
        data.batches = batches;
      }
      if (dueDate) {
        data.dueDate = dueDate;
      } else {
        data.dueDate = null;
      }

      let updatedQuiz = await Quiz.findOneAndUpdate(
        {
          _id: id,
        },
        { $set: data },
        {
          new: true,
        }
      ).populate("batches");
      return sendResponse(res, httpCodes.OK, {
        message: "Quiz Updated successfully",
        quiz: updatedQuiz,
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async deleteQuiz(req, res) {
    try {
      let id = req.params.id;

      let quiz = await Quiz.findOne({
        _id: id,
      });
      if (quiz.quizAttempts && quiz.quizAttempts.length > 0) {
        throw "Cannot delete quiz as quiz is already attempted";
      }

      await Quiz.findOneAndDelete({
        _id: id,
      });
      return sendResponse(res, httpCodes.OK, {
        message: "Quiz Deleted successfully",
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },
};
