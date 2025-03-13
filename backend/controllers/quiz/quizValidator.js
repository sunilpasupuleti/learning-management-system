const { lowercase, uppercase } = require("../../helpers/typography");
const {
  sendResponse,
  httpCodes,
  getObjectId,
} = require("../../helpers/utility");
const Quiz = require("../../models/Quiz");
const QuizAttempt = require("../../models/QuizAttempt");
const Users = require("../../models/Users");
const _ = require("lodash");

module.exports = {
  async validateCreateQuiz(req, res, next) {
    const {
      name,
      totalMarks,
      availableFrom,
      availableUntil,
      batches,
      timeLimit,
      attempts,
      availableToEveryone,
      questions,
      timeLimitEnabled,
      attemptsEnabled,
      passPercentage,
      singleQuestionMarks,
    } = req.body;
    try {
      if (!name) {
        throw "Quiz Name required";
      }

      if (typeof timeLimit !== "number" && timeLimitEnabled) {
        throw "Time Limit required";
      }

      if (typeof attempts !== "number" && attemptsEnabled) {
        throw "Attempts required";
      }

      if (typeof totalMarks !== "number") {
        throw "Invalid Total Marks Format";
      }

      if (typeof singleQuestionMarks !== "number") {
        throw "Single Question Marks Format";
      }

      if (typeof passPercentage !== "number") {
        throw "Invalid Pass Marks Format";
      }

      if (!availableFrom) {
        throw "Available from required";
      }

      if (!availableUntil) {
        throw "Available Until required";
      }

      if (!availableToEveryone && (!batches || batches.length === 0)) {
        throw "Please select students to give access";
      }

      if (!questions || questions.length === 0) {
        throw "Please select questions";
      }

      for (i = 0; i < questions.length; i++) {
        let question = questions[i];
        let { questionText, questionType, options } = question;
        if (!questionText) {
          throw `Question required at position ${i + 1} `;
        }
        if (!questionType) {
          throw `Question type required for question at position ${i + 1} `;
        }
        if (!options || options.length === 0) {
          throw `Options required for question at position ${i + 1}`;
        }
      }

      next();
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e,
      });
    }
  },

  async validateSubmitQuiz(req, res, next) {
    try {
      const { timeSpentInSeconds, questions } = req.body;
      let quizId = req.params.id;
      quizId = getObjectId(quizId);
      let user = req.user;
      user = await Users.findOne({
        _id: user._id,
      });
      let quiz = await Quiz.findOne({
        _id: quizId,
      });
      if (quiz.attemptsEnabled) {
        let totalAttempts = quiz.attempts;
        let attemptsCount = await QuizAttempt.countDocuments({
          "quiz._id": quizId,
          user: user._id,
        });
        // count current count
        if (attemptsCount >= totalAttempts) {
          throw "You have reached maximum number of attempts for this Quiz!";
        }
      }
      if (!quiz) {
        throw "No Quiz Found";
      }
      let userExistsInBatch = _.intersectionWith(
        user.batches,
        quiz.batches,
        _.isEqual
      );

      console.log(userExistsInBatch);
      if (
        !quiz.availableToEveryone &&
        (!userExistsInBatch || userExistsInBatch.length == 0)
      ) {
        throw "Quiz is not available to you";
      }

      if (typeof timeSpentInSeconds !== "number") {
        throw "Required Time Spent";
      }

      if (!questions || questions.length === 0) {
        throw "Please select questions";
      }

      next();
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },
};
