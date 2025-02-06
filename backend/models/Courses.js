const { Types, Schema, default: mongoose } = require("mongoose");
const { ObjectId } = Types;

const coursesSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    visible: {
      type: Boolean,
      required: true,
      default: true,
    },
    headline: {
      type: String,
      required: true,
    },
    totalDuration: {
      type: Number,
      required: true,
    },
    totalLectures: {
      type: Number,
      required: true,
    },
    courseId: {
      type: String,
      required: true,
    },
    banner: {
      type: String,
      required: true,
    },
    description: {
      type: String,
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
    content: {
      sections: [
        {
          title: { type: String, required: true },
          sectionId: { type: String, required: true },
          videos: [
            {
              title: { type: String, required: true },
              duration: { type: Number, required: true },
              path: { type: String, required: true },
            },
          ],
          resources: [
            {
              title: { type: String, required: true },
              path: { type: String, required: true },
            },
          ],
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Courses", coursesSchema);
