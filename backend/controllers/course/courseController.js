const {
  sendResponse,
  httpCodes,
  userRole,
  getObjectId,
} = require("../../helpers/utility");
const { capitalize, uppercase } = require("../../helpers/typography");
const _ = require("lodash");
const Courses = require("../../models/Courses");
const {
  uploadMultipleToS3,
  uploadSingleToS3,
  deleteMultipleFromS3,
  deleteSingleFromS3,
  deleteFolderFromS3,
} = require("../../helpers/s3Helpers");
const { getIo } = require("../../sockets/socketManager");
const Batches = require("../../models/Batches");
const Users = require("../../models/Users");

const uploadFiles = async (files, fileType) => {
  const io = getIo();
  if (files && files.length > 0) {
    await Promise.all(
      files.map(async (file) => {
        const progressCallback = (progress) => {
          const percentUploaded = Math.round(
            (progress.loaded / progress.total) * 100
          );
          io.emit("courseFileUploadProgress", {
            ...file,
            type: fileType,
            progress: percentUploaded,
          });
        };
        await uploadSingleToS3(file, progressCallback);
      })
    );
  }
};

module.exports = {
  async getCourse(req, res) {
    let { id } = req.params;
    let user = req.user;
    let role = user.role;
    let course;
    let query = {
      _id: id,
    };
    if (role === userRole) {
      query.visible = true;
    }
    course = await Courses.findOne(query).populate("batches");

    return sendResponse(res, httpCodes.OK, {
      message: "Course Details",
      course: course,
    });
  },

  async getCourses(req, res) {
    let user = req.user;
    let role = user.role;
    let query = {};
    user = await Users.findOne({
      _id: user._id,
    });
    console.log(user);
    if (role === userRole) {
      query = {
        visible: true,
        $or: [
          { availableToEveryone: true },
          {
            availableToEveryone: false,
            batches: { $in: user.batches },
          },
        ],
      };
    }
    const courses = await Courses.find(query).populate("batches").sort({
      createdAt: -1,
    });
    return sendResponse(res, httpCodes.OK, {
      message: "Courses ",
      courses: courses,
    });
  },

  async createCourse(req, res) {
    try {
      const {
        title,
        visible,
        headline,
        banner,
        courseId,
        description,
        availableToEveryone,
        batches,
        content,
        totalDuration,
        totalLectures,
        toUploadVideos,
        toUploadBanner,
        toUploadResources,
      } = req.body;
      let data = {
        title: title,
        headline: headline,
        visible: visible,
        banner: banner,
        courseId: courseId,
        description: description,
        batches: [],
        availableToEveryone: availableToEveryone,
        totalDuration: totalDuration,
        totalLectures: totalLectures,
        content: content,
      };

      if (!availableToEveryone) {
        data.batches = batches;
      }

      await uploadSingleToS3(toUploadBanner);

      await Courses.create(data);

      sendResponse(res, httpCodes.OK, {
        message:
          "Course added successfully & Files will be uploaded in background",
      });

      await Promise.all([
        uploadFiles(toUploadVideos, "video"),
        uploadFiles(toUploadResources, "resource"),
      ]);

      // await uploadMultipleToS3(toUploadVideos);
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async editCourse(req, res) {
    try {
      let courseId = req.params.id;
      const {
        title,
        headline,
        visible,
        banner,
        description,
        availableToEveryone,
        batches,
        toUploadBanner,
        toUploadVideos,
        toUploadResources,
        totalDuration,
        totalLectures,
        content,
      } = req.body;
      let data = {
        title: title,
        headline: headline,
        visible: visible,
        banner: banner,
        description: description,
        batches: [],
        availableToEveryone: availableToEveryone,
        totalDuration: totalDuration,
        totalLectures: totalLectures,
        content: content,
      };

      if (!availableToEveryone) {
        data.batches = batches;
      }

      let course = await Courses.findOne({
        _id: courseId,
      });

      let currentBannerPath = course.banner;

      if (banner !== currentBannerPath) {
        await deleteSingleFromS3(currentBannerPath);
        await uploadSingleToS3(toUploadBanner);
      }

      // if (toUploadVideos && toUploadVideos.length > 0) {
      //   await uploadMultipleToS3(toUploadVideos);
      // }

      let updatedCourse = await Courses.findOneAndUpdate(
        {
          _id: courseId,
        },
        { $set: data },
        {
          new: true,
        }
      ).populate("batches");

      sendResponse(res, httpCodes.OK, {
        message:
          "Course Updated successfully & Files will be uploaded in background",
        course: updatedCourse,
      });
      await Promise.all([
        uploadFiles(toUploadVideos, "video"),
        uploadFiles(toUploadResources, "resource"),
      ]);
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async deleteCourse(req, res) {
    try {
      let id = req.params.id;
      let course = await Courses.findOne({
        _id: id,
      });
      let courseId = course.courseId;

      await deleteFolderFromS3(courseId);
      await Courses.findOneAndDelete({
        _id: id,
      });
      return sendResponse(res, httpCodes.OK, {
        message: "Course Deleted successfully",
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async removeCourseVideos(req, res) {
    try {
      let videoPaths = req.body.videos;
      let courseId = req.params.id;
      // Fetch course and videos
      const course = await Courses.findById(courseId);
      const allVideos = _.flatMap(course.content.sections, "videos");
      const filteredVideos = _.filter(
        allVideos,
        (video) => !videoPaths.includes(video.path)
      );
      let totalLecutures = 0;
      let totalDuration = 0;
      filteredVideos.map((video) => {
        totalLecutures++;
        totalDuration += video.duration;
      });

      await deleteMultipleFromS3(videoPaths);
      let updatedCourse = await Courses.findOneAndUpdate(
        {
          _id: courseId,
        },
        {
          $pull: {
            "content.sections.$[].videos": {
              path: { $in: videoPaths },
            },
          },
          $set: {
            totalDuration: totalDuration,
            totalLectures: totalLecutures,
          },
        },
        {
          new: true,
        }
      );
      return sendResponse(res, httpCodes.OK, {
        message: "Videos Removed successfully",
        course: updatedCourse,
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async removeSection(req, res) {
    try {
      let id = req.params.id;
      let { sectionId } = req.body;
      // Fetch course and videos
      const course = await Courses.findById(id);
      let courseId = course.courseId;
      const videoPaths = _.flatMap(course.content.sections, (section) => {
        if (section.sectionId === sectionId) {
          return _.map(section.videos, "path");
        } else {
          return [];
        }
      });

      const allVideos = _.flatMap(course.content.sections, "videos");
      const filteredVideos = _.filter(
        allVideos,
        (video) => !videoPaths.includes(video.path)
      );
      let totalLecutures = 0;
      let totalDuration = 0;
      filteredVideos.map((video) => {
        totalLecutures++;
        totalDuration += video.duration;
      });

      await deleteFolderFromS3(`${courseId}/${sectionId}`);
      let updatedCourse = await Courses.findOneAndUpdate(
        {
          _id: id,
        },
        {
          $pull: {
            "content.sections": {
              sectionId: sectionId,
            },
          },
          $set: {
            totalDuration: totalDuration,
            totalLectures: totalLecutures,
          },
        },
        {
          new: true,
        }
      );
      return sendResponse(res, httpCodes.OK, {
        message: "Videos Removed successfully",
        course: updatedCourse,
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async removeCourseResources(req, res) {
    try {
      let resourcePaths = req.body.resources;
      let courseId = req.params.id;

      await deleteMultipleFromS3(resourcePaths);
      let updatedCourse = await Courses.findOneAndUpdate(
        {
          _id: courseId,
        },
        {
          $pull: {
            "content.sections.$[].resources": {
              path: { $in: resourcePaths },
            },
          },
        },
        {
          new: true,
        }
      );
      return sendResponse(res, httpCodes.OK, {
        message: "Resources Removed successfully",
        course: updatedCourse,
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },
};
