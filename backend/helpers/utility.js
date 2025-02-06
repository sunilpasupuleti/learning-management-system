const httpstatus = require("http-status-codes");
const crypto = require("crypto-js");
const mongoose = require("mongoose");
const logger = require("../middleware/logger/logger");
const ObjectId = mongoose.Types.ObjectId;
const jwt = require("jsonwebtoken");
const { storage } = require("firebase-admin");
const FIREBASE_STORAGE_URL = process.env.FIREBASE_STORAGE_URL;

const superAdminRole = "superAdmin";
const adminRole = "admin";
const trainerRole = "trainer";
const userRole = "user";
const roles = [superAdminRole, adminRole, trainerRole, userRole];
const { nanoid } = require("nanoid");

module.exports = {
  httpCodes: { ...httpstatus.StatusCodes },
  sendResponse,
  encryptAES,
  decryptAES,
  validateParamsObjectId,
  validateMongooseObjectId,
  getJwt,
  cryptoDecrypt,
  cryptoEncrypt,
  getPictureExtensionFromBase64,
  getBufferFromBase64,
  generateFileName,
  getFirebaseAccessUrl,
  uploadBase64ToFirebase,
  deleteFileFromFirebase,
  getObjectId,
  uploadMultipleBase64ToFirebase,
  deleteMulitpleFilesFromFirebase,
  copyFile,
  // roles
  superAdminRole,
  adminRole,
  trainerRole,
  userRole,
  roles,
  generateRandomId,
};

function generateRandomId(length = 10) {
  return nanoid(length);
}

function getFirebaseAccessUrl(path = "") {
  let URL = FIREBASE_STORAGE_URL + path.replaceAll("/", "%2f") + "?alt=media";
  return URL;
}

function generateFileName(startString, extension) {
  let name =
    startString +
    "_" +
    Math.random().toString(36).substring(2, 10) +
    "." +
    extension;
  return name;
}

function getBufferFromBase64(base64String) {
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  return buffer;
}

function getPictureExtensionFromBase64(base64) {
  let pictureExtension = base64.substring(
    "data:image/".length,
    base64.indexOf(";base64")
  );
  return pictureExtension;
}

async function uploadBase64ToFirebase(base64, path, imageName) {
  return new Promise(async (resolve, reject) => {
    try {
      let extension = getPictureExtensionFromBase64(base64);
      const buffer = getBufferFromBase64(base64);
      let pictureName = generateFileName(imageName, extension);
      let picturePath = `${path}/${pictureName}`;
      const file = storage().bucket().file(picturePath);
      await file.save(buffer, {
        contentType: `image/${extension}`,
      });

      let downloadURL = getFirebaseAccessUrl(picturePath);
      resolve(downloadURL);
    } catch (e) {
      reject(e.toString());
    }
  });
}

async function uploadMultipleBase64ToFirebase(base64Array, path, imageName) {
  return new Promise(async (resolve, reject) => {
    try {
      const uploadPromises = base64Array.map(async (base64) => {
        try {
          let extension = getPictureExtensionFromBase64(base64);
          const buffer = getBufferFromBase64(base64);
          let pictureName = generateFileName(imageName, extension);
          let picturePath = `${path}/${pictureName}`;
          const file = storage().bucket().file(picturePath);
          await file.save(buffer, {
            contentType: `image/${extension}`,
          });

          let downloadURL = getFirebaseAccessUrl(picturePath);
          return downloadURL;
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

async function deleteFileFromFirebase(url) {
  return new Promise(async (resolve, reject) => {
    try {
      url = url.replaceAll("%2f", "/");
      url = url.replaceAll("?alt=media", "");
      const filePath = url.replace(FIREBASE_STORAGE_URL, "");
      await storage().bucket().file(filePath).delete();
      resolve(true);
    } catch (e) {
      reject(e.toString());
    }
  });
}

async function copyFile(sourceUrl, path, imageName) {
  return new Promise(async (resolve, reject) => {
    try {
      sourceUrl = sourceUrl.replaceAll("%2f", "/");
      sourceUrl = sourceUrl.replaceAll("?alt=media", "");
      const filePath = sourceUrl.replace(FIREBASE_STORAGE_URL, "");
      let extension = filePath.split(".")[1];
      let pictureName = generateFileName(imageName, extension);
      let destinationPath = `${path}/${pictureName}`;

      const sourceFile = storage().bucket().file(filePath);
      const destinationFile = storage().bucket().file(destinationPath);

      await sourceFile.copy(destinationFile);

      let downloadURL = getFirebaseAccessUrl(destinationPath);

      resolve(downloadURL);
    } catch (error) {
      console.error("Error copying file:", error);
      reject(error);
    }
  });
}

async function deleteMulitpleFilesFromFirebase(urls) {
  return new Promise(async (resolve, reject) => {
    try {
      const deletePromises = urls.map(async (url) => {
        try {
          url = url.replaceAll("%2f", "/");
          url = url.replaceAll("?alt=media", "");
          const filePath = url.replace(FIREBASE_STORAGE_URL, "");
          await storage().bucket().file(filePath).delete();
          return true;
        } catch (e) {
          throw e;
        }
      });
      const results = await Promise.all(deletePromises);
      resolve(results);
    } catch (e) {
      reject(e.toString());
    }
  });
}

function getJwt(data, expiry = "1h") {
  const token = jwt.sign({ data: data }, process.env.JWT_SECRET, {
    expiresIn: expiry,
  });
  return token;
}

function cryptoEncrypt(data) {
  const encryptToken = crypto.AES.encrypt(
    data,
    process.env.AES_ENCRYPTION_KEY
  ).toString();
  return encryptToken;
}

function cryptoDecrypt(data) {
  const decryptToken = crypto.AES.decrypt(
    data,
    process.env.AES_ENCRYPTION_KEY
  ).toString(crypto.enc.Utf8);
  return decryptToken;
}

function sendResponse(response, code = httpstatus.StatusCodes, data = {}) {
  //check if it exists in code;
  let exists = Object.keys(httpstatus.StatusCodes).filter((c) => c == code);
  if (!exists || exists.length === 0) {
    logger.info("No response code found");
    return;
  }
  return response.status(code).json(data);
}

function encryptAES(data, key) {
  let cipherText = crypto.AES.encrypt(String(data), key).toString();
  return cipherText;
}

function decryptAES(cipherText, key) {
  var bytes = crypto.AES.decrypt(cipherText, key);
  var originalText = bytes.toString(crypto.enc.Utf8);
  return originalText;
}

function validateParamsObjectId(paramName) {
  return (req, res, next) => {
    let id = req.params.id;
    if (paramName) {
      id = req.params[paramName];
    }
    let validObjectId = ObjectId.isValid(id);
    if (validObjectId) {
      next();
    } else {
      return sendResponse(res, httpstatus.StatusCodes.BAD_REQUEST, {
        message: "Invalid Param Id Cannot cast to mongoose",
      });
    }
  };
}

function validateMongooseObjectId(id) {
  let validObjectId = ObjectId.isValid(id);
  return validObjectId;
}

function getObjectId(id) {
  return new ObjectId(id);
}
