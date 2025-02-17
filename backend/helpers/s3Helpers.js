const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION;
const bucket = process.env.AWS_S3_BUCKET_NAME;

// Configure AWS
aws.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

const s3 = new aws.S3();

async function uploadMultipleToS3(files) {
  return new Promise(async (resolve, reject) => {
    try {
      const uploadPromises = files.map(async (file) => {
        try {
          const s3Key = file.path;
          const uploadParams = {
            Bucket: bucket,
            Key: s3Key,
            Body: file.buffer,
            ContentType: file.mimetype,
          };

          await s3.upload(uploadParams).promise();
          return true;
        } catch (e) {
          throw e;
        }
      });

      const results = await Promise.all(uploadPromises);
      resolve(results);
    } catch (e) {
      reject(e.toString());
    }
  });
}

async function deleteMultipleFromS3(paths) {
  return new Promise(async (resolve, reject) => {
    try {
      const deleteParams = {
        Bucket: bucket,
        Delete: {
          Objects: paths.map((key) => ({ Key: key })),
          Quiet: false,
        },
      };
      const result = await s3.deleteObjects(deleteParams).promise();
      resolve(result);
    } catch (e) {
      reject(e.toString());
    }
  });
}

async function uploadSingleToS3(file, onProgress = () => {}) {
  return new Promise(async (resolve, reject) => {
    try {
      let { path, buffer, mimetype } = file;
      buffer = buffer.data ? Buffer.from(buffer.data) : buffer;
      const uploadParams = {
        Bucket: bucket,
        Key: path,
        Body: buffer,
        ContentType: mimetype,
      };

      await s3
        .upload(uploadParams)
        .on("httpUploadProgress", (progress) => {
          onProgress(progress);
        })
        .promise();
      resolve(true);
    } catch (e) {
      reject(e.toString());
    }
  });
}

async function deleteSingleFromS3(key) {
  return new Promise(async (resolve, reject) => {
    try {
      const deleteParams = {
        Bucket: bucket,
        Key: key,
      };

      const result = await s3.deleteObject(deleteParams).promise();
      resolve(result);
    } catch (e) {
      reject(e.toString());
    }
  });
}

function deleteFolderFromS3(path) {
  return new Promise(async (resolve, reject) => {
    try {
      const objects = await s3
        .listObjectsV2({ Bucket: bucket, Prefix: path })
        .promise();

      await Promise.all(
        objects.Contents.map((obj) =>
          s3.deleteObject({ Bucket: bucket, Key: obj.Key }).promise()
        )
      );

      resolve(true);
    } catch (error) {
      reject(`Error deleting folder ${path}: ${error}`);
    }
  });
}

module.exports = {
  uploadMultipleToS3,
  uploadSingleToS3,
  deleteMultipleFromS3,
  deleteSingleFromS3,
  deleteFolderFromS3,
};
