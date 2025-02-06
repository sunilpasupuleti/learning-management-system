const { Types, Schema, default: mongoose } = require("mongoose");
const { ObjectId } = Types;

const quizSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    singleQuestionMarks: {
      type: Number,
      required: true,
    },
    passPercentage: {
      type: Number,
      required: true,
    },
    availableFrom: {
      type: Date,
      required: true,
    },
    availableUntil: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
    },
    timeLimitEnabled: {
      type: Boolean,
      default: false,
      required: true,
    },
    timeLimit: {
      type: Number,
    },
    attemptsEnabled: {
      type: Boolean,
      default: false,
      required: true,
    },
    attempts: {
      type: Number,
    },
    availableToEveryone: {
      type: Boolean,
      required: true,
      default: true,
    },
    batches: [
      {
        type: ObjectId,
        ref: "Batches",
      },
    ],
    questions: [
      {
        questionText: {
          type: String,
          required: true,
        },
        questionType: {
          type: String,
          enum: ["fill_in_the_blank", "single_option", "multiple_options"],
          required: true,
        },
        options: [
          {
            optionText: {
              type: String,
              required: true,
            },
            isCorrect: {
              type: Boolean,
              required: true,
            },
          },
        ],
      },
    ],
    quizAttempts: [
      {
        type: ObjectId,
        ref: "QuizAttempt",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Quizes", quizSchema);
