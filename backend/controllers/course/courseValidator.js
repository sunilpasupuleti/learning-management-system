const {
  sendResponse,
  httpCodes,
  generateFileName,
  generateRandomId,
} = require("../../helpers/utility");
const Courses = require("../../models/Courses");
const Quiz = require("../../models/Quiz");
const _ = require("lodash");

module.exports = {
  async validateCreateCourse(req, res, next) {
    try {
      let mode = req.mode;
      let id = req.params.id;
      let courseId = generateRandomId();

      if (mode === "update") {
        let course = await Courses.findOne({ _id: id });
        courseId = course.courseId;
      }

      let data = JSON.parse(req.body.data);
      if (!data) {
        throw "No data provided";
      }

      let finalData = data;
      const {
        title,
        headline,
        batches,
        availableToEveryone,
        content,
        visible,
      } = data;

      let banner = req.files?.banner?.[0];
      let videoFiles = req.files?.videos;
      let resourceFiles = req.files?.resources;
      let totalDuration = 0;
      let totalLectures = 0;

      if (!title) throw "Course Title is required";
      if (!headline) throw "Headline is required";
      if (!content) throw "Content is required";
      if (typeof visible !== "boolean") throw "Course Visibility is required";
      if (!availableToEveryone && (!batches || batches.length === 0)) {
        throw "Please select students to give access";
      }
      if (!banner && mode !== "update") throw "Banner image is required";

      let { sections } = content;
      if (!sections || sections.length === 0) {
        throw "Please add at least one section";
      }

      let structuredSections = [];
      let toUploadVideos = [];
      let toUploadResources = [];
      let toUploadBanner = {};
      let bannerPath = null;

      if (banner) {
        let bannerExtension = banner.mimetype.split("/")[1];
        bannerPath = `${courseId}/${generateRandomId()}_banner.${bannerExtension}`;
        toUploadBanner.buffer = banner.buffer;
        toUploadBanner.mimetype = banner.mimetype;
        toUploadBanner.path = bannerPath;
      } else {
        bannerPath = `${data.banner}`;
      }

      for (let i = 0; i < sections.length; i++) {
        let section = sections[i];
        let {
          title: sectionTitle,
          videos,
          sectionId: secId,
          resources,
        } = section;
        let sectionId = secId || generateRandomId();

        if (!sectionTitle) throw `Section Title required at position ${i + 1}`;
        if (!videos || videos.length === 0)
          throw `At least one video required at position ${i + 1}`;

        let obj = { title: sectionTitle, sectionId, videos: [], resources: [] };

        for (let j = 0; j < videos.length; j++) {
          let video = videos[j];
          let { title: videoTitle, duration, path: videoPath } = video;
          totalLectures++;
          totalDuration += duration;

          if (!videoTitle) throw `Video Title required at position ${j + 1}`;
          if (typeof duration !== "number")
            throw `No duration provided for video at ${j + 1}`;

          let pattern = `video_section${i}_video${j}`;
          let videoObj = { title: videoTitle, duration };

          if (videoFiles && videoFiles.length > 0) {
            let videoFound = videoFiles.find((v) =>
              v.originalname.startsWith(pattern)
            );
            if (videoFound) {
              let { buffer, mimetype } = videoFound;
              let extension = mimetype.split("/")[1];
              let fileName = generateFileName("video", extension);
              let path = `${courseId}/${sectionId}/${fileName}`;
              let toUploadVideoObj = { buffer, mimetype, path };
              videoObj.path = path;
              toUploadVideos.push(toUploadVideoObj);
            } else {
              videoObj.path = videoPath;
            }
          } else {
            videoObj.path = videoPath;
          }
          obj.videos.push(videoObj);
        }

        if (resources && resources.length > 0) {
          for (let j = 0; j < resources.length; j++) {
            let resource = resources[j];
            let { title: resourceTitle, path: resourcePath } = resource;

            if (!resourceTitle)
              throw `Resource Title required at position ${j + 1}`;

            let pattern = `resource_section${i}_resource${j}`;
            let resourceObj = { title: resourceTitle };

            if (resourceFiles && resourceFiles.length > 0) {
              let resourceFound = resourceFiles.find((r) =>
                r.originalname.startsWith(pattern)
              );
              if (resourceFound) {
                let { buffer, mimetype } = resourceFound;
                let extension = mimetype.split("/")[1];
                let fileName = generateFileName("resource", extension);
                let path = `${courseId}/${sectionId}/resources/${fileName}`;
                let toUploadResourceObj = { buffer, mimetype, path };
                resourceObj.path = path;
                toUploadResources.push(toUploadResourceObj);
              } else {
                resourceObj.path = resourcePath;
              }
            } else {
              resourceObj.path = resourcePath;
            }
            obj.resources.push(resourceObj);
          }
        }
        structuredSections.push(obj);
      }

      let courseExists;
      if (mode && mode === "update") {
        courseExists = await Courses.findOne({
          _id: { $ne: id },
          title: _.startCase(title),
        });
      } else {
        courseExists = await Courses.findOne({ title: _.startCase(title) });
      }

      if (courseExists) throw "Course Name Already Exists";

      finalData.courseId = courseId;
      finalData.banner = bannerPath;
      finalData.totalDuration = totalDuration;
      finalData.totalLectures = totalLectures;
      finalData.content.sections = structuredSections;
      finalData.toUploadVideos = toUploadVideos;
      finalData.toUploadBanner = toUploadBanner;
      finalData.toUploadResources = toUploadResources;
      req.body = finalData;

      next();
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async validateRemoveSection(req, res, next) {
    try {
      const { sectionId } = req.body;
      if (!sectionId) throw "Section ID is required";

      next();
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, { message: e });
    }
  },
};
