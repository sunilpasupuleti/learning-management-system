const { Types, Schema, default: mongoose } = require("mongoose");
const { ObjectId } = Types;

const quizAttemptSchema = new Schema(
  {
    quiz: {
      type: Object,
    },
    user: {
      type: ObjectId,
      ref: "Users",
    },
    submittedOn: {
      type: Date,
      required: true,
    },
    correctAnswers: {
      type: Number,
      required: true,
    },
    unattemptedAnswers: {
      type: Number,
      required: true,
    },
    reviewMarkedAnswers: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    incorrectAnswers: {
      type: Number,
      required: true,
    },
    marksObtained: {
      type: Number,
      required: true,
    },
    timeSpentInSeconds: {
      type: Number,
    },
    result: {
      type: String,
      required: true,
    },
    answers: [
      {
        questionId: {
          type: String, // Reference to the question id in the questions array
          required: true,
        },

        selectedOption: {
          type: String,
        },
        selectedOptions: [
          {
            type: String,
          },
        ],
        isCorrect: {
          type: Boolean,
          required: true,
        },
        reviewMarked: {
          type: Boolean,
          required: true,
        },
        unattempted: {
          type: Boolean,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("QuizAttempts", quizAttemptSchema);
