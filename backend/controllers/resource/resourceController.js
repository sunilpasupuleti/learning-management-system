const { sendResponse, httpCodes, userRole } = require("../../helpers/utility");
const _ = require("lodash");
const Courses = require("../../models/Courses");
const {
  uploadSingleToS3,
  deleteMultipleFromS3,
} = require("../../helpers/s3Helpers");
const { getIo } = require("../../sockets/socketManager");
const Resources = require("../../models/Resources");
const mongoose = require("mongoose");

const uploadFiles = async (files, fileType) => {
  const io = getIo();
  if (files && files.length > 0) {
    await Promise.all(
      files.map(async (file) => {
        const progressCallback = (progress) => {
          const percentUploaded = Math.round(
            (progress.loaded / progress.total) * 100
          );
          io.emit("resourceFileUploadProgress", {
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
  async getResources(req, res) {
    let query = {};
    const resources = await Resources.find(query).sort({
      position: 1,
    });
    return sendResponse(res, httpCodes.OK, {
      message: "Resources ",
      resources: resources,
    });
  },

  async createResources(req, res) {
    try {
      const { resources, toUploadResources } = req.body;
      await Resources.insertMany(resources);

      sendResponse(res, httpCodes.OK, {
        message:
          "Resources added successfully & Files will be uploaded in background",
      });

      await Promise.all([uploadFiles(toUploadResources, "resource")]);
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async editResources(req, res) {
    try {
      const { resources, toUploadResources } = req.body;

      const toUpdateResources = resources.filter((r) => r.id);
      const toInsertResources = resources.filter((r) => !r.id);
      if (toUpdateResources.length > 0) {
        const updatePromises = toUpdateResources.map((resource) => {
          const resourceId = new mongoose.Types.ObjectId(resource.id);
          return Resources.updateOne(
            { _id: resourceId },
            {
              $set: {
                title: resource.title,
                path: resource.path,
                position: resource.position,
              },
            }
          );
        });

        await Promise.all(updatePromises);
      }
      if (toInsertResources.length > 0) {
        await Resources.insertMany(toInsertResources);
      }

      sendResponse(res, httpCodes.OK, {
        message:
          "Resources Updated successfully & Files will be uploaded in background",
      });
      await Promise.all([uploadFiles(toUploadResources, "resource")]);
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async removeResources(req, res) {
    try {
      let resources = req.body.resources;

      const resourcePaths = resources.map((resource) => resource.path);
      const resourceIds = resources.map((resource) => resource._id);

      const result = await Resources.deleteMany({
        _id: { $in: resourceIds },
      });

      await deleteMultipleFromS3(resourcePaths);

      return sendResponse(res, httpCodes.OK, {
        message: "Resources Removed successfully",
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },
};
