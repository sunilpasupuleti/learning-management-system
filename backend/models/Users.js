const { Types, Schema, default: mongoose } = require("mongoose");
const { roles } = require("../helpers/utility");
const { ObjectId } = Types;
const usersSchema = new Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    password: { type: String },
    batches: [{ type: ObjectId, ref: "Batches" }],
    verified: { type: Boolean, default: false },
    verificationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordTokenExpires: { type: Date },
    quizAttempts: [
      {
        type: ObjectId,
        ref: "QuizAttempts",
      },
    ],
    role: { type: String, default: "user", enum: roles },
  },
  {
    timestamps: true,
    strict: false,
  }
);

module.exports = mongoose.model("Users", usersSchema);
