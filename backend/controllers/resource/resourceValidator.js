const {
  sendResponse,
  httpCodes,
  generateFileName,
} = require("../../helpers/utility");
const Courses = require("../../models/Courses");
const Quiz = require("../../models/Quiz");
const _ = require("lodash");

module.exports = {
  async validateCreateResources(req, res, next) {
    try {
      let data = JSON.parse(req.body.data);
      if (!data) {
        throw "no data";
      }

      let finalData = data;

      const { resources } = data;

      let resourceFiles = req.files?.resources;

      if (!resources) {
        throw "Resources required";
      }

      let structuredResources = [];
      let toUploadResources = [];

      for (j = 0; j < resources.length; j++) {
        let resource = resources[j];
        let {
          title: resourceTitle,
          path: resourcePath,
          id: resourceId,
          position,
        } = resource;

        if (!resourceTitle) {
          throw `Resource Title required at position ${j + 1} `;
        }

        let pattern = `resource${j}`;

        let resourceObj = {
          title: resourceTitle,
          position: position,
        };

        if (resourceId) {
          resourceObj.id = resourceId;
        }

        if (resourceFiles && resourceFiles.length > 0) {
          let resourceFound = resourceFiles.find((r) =>
            r.originalname.startsWith(pattern)
          );

          if (resourceFound) {
            let { buffer, mimetype } = resourceFound;
            let extension = mimetype.split("/")[1];
            let fileName = generateFileName("resource", extension);
            let path = `Resources/${fileName}`;
            let toUploadResourceObj = {
              buffer: buffer,
              mimetype: mimetype,
              path: path,
            };
            resourceObj.path = path;
            toUploadResources.push(toUploadResourceObj);
          } else {
            resourceObj.path = resourcePath;
          }
        } else {
          resourceObj.path = resourcePath;
        }
        structuredResources.push(resourceObj);
      }

      finalData.resources = structuredResources;
      finalData.toUploadResources = toUploadResources;
      req.body = finalData;

      next();
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },
};
