const { Types, Schema, default: mongoose } = require("mongoose");
const { ObjectId } = Types;

const batchesSchema = new Schema(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    trainers: [
      {
        type: ObjectId,
        ref: "Users",
      },
    ],
    students: [
      {
        type: ObjectId,
        ref: "Users",
      },
    ],
  },
  {
    timestamps: true,
  }
);
batchesSchema.index({ students: 1 });

module.exports = mongoose.model("Batches", batchesSchema);
