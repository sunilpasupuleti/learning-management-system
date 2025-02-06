import AWS from "aws-sdk";
import FileSaver from "file-saver";
import JSZip from "jszip";

const AWS_REGION = process.env.REACT_APP_AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.REACT_APP_AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.REACT_APP_AWS_SECRET_ACCESS_KEY;
const AWS_S3_BUCKET_NAME = process.env.REACT_APP_AWS_S3_BUCKET_NAME;

const s3 = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

export const downloadFileFromS3Url = (path, fileName) => {
  return new Promise(async (resolve, reject) => {
    try {
      const presignedUrl = await generatePresignedUrl(path);
      const response = await fetch(presignedUrl);
      const data = await response.blob();
      const blob = new Blob([data]);
      FileSaver.saveAs(blob, fileName);
      resolve(true);
    } catch (error) {
      reject(error);
    }
  });
};

export const onDownloadAllFilesFromS3 = async (resources, fName) => {
  return new Promise(async (resolve, reject) => {
    try {
      const zip = new JSZip();
      // Fetch all resources in parallel
      const downloadPromises = resources.map(async (resource) => {
        const { fileName, path } = resource;
        // Fetch the resource content
        const presignedUrl = await generatePresignedUrl(path);
        const response = await fetch(presignedUrl);
        const data = await response.blob();
        // Add the file to the zip
        zip.file(fileName, data);
      });
      // Wait for all downloads to complete before generating the zip
      await Promise.all(downloadPromises);
      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: "blob" });
      // Save the zip file
      FileSaver.saveAs(zipBlob, fName);
    } catch (error) {
      reject(error);
    }
  });
};

export const generatePresignedUrl = async (path, expires = 300) => {
  const params = {
    Bucket: AWS_S3_BUCKET_NAME,
    Key: path,
    Expires: expires,
  };

  try {
    const url = await s3.getSignedUrlPromise("getObject", params);
    return url;
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw error;
  }
};
