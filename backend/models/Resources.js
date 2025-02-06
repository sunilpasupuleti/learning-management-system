const { Types, Schema, default: mongoose } = require("mongoose");

const resourcesSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    path: { type: String, required: true },
    position: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Resources", resourcesSchema);
