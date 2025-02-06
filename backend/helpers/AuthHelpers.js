const { cryptoDecrypt, sendResponse, httpCodes } = require("./utility");
const logger = require("../middleware/logger/logger");
const jwt = require("jsonwebtoken");

module.exports = {
  VerifyToken: async (req, res, next) => {
    if (!req.cookies || !req.cookies.refreshToken) {
      logger.error("no refresh token and unauthorized");
      return sendResponse(res, httpCodes.UNAUTHORIZED, {
        message: "Unauthorized",
        refreshToken: null,
      });
    }

    if (
      (!req.cookies || !req.cookies.accessToken) &&
      req.cookies.refreshToken
    ) {
      logger.error("unauthorized, there is no access token but refesh token");
      return sendResponse(res, httpCodes.UNAUTHORIZED, {
        message: "Unauthorized",
        accessToken: null,
      });
    }
    if (!req.cookies.accessToken) {
      logger.error("unauthorized, there is no access token");
      return sendResponse(res, httpCodes.UNAUTHORIZED, {
        message: "Unauthorized",
      });
    }

    let token = req.cookies.accessToken;
    if (!token) {
      console.error("No token provided");
      return sendResponse(res, httpCodes.UNAUTHORIZED, {
        message: "No token provided to access the server",
      });
    }
    token = cryptoDecrypt(token);

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        if (err.expiredAt < new Date()) {
          return sendResponse(res, httpCodes.UNAUTHORIZED, {
            message:
              "Your security token had expired! Please login again to continue",
            accessToken: null,
          });
        }
        return sendResponse(res, httpCodes.UNAUTHORIZED, {
          message: "Jwt error " + err.message,
        });
      }
      let userData = decoded.data;
      req.user = userData;
      next();
    });
  },

  checkRole: (allowedRoles) => {
    return (req, res, next) => {
      let userData = req.user;
      let role = userData.role;
      if (allowedRoles.includes(role)) {
        next();
      } else {
        return sendResponse(res, httpCodes.UNAUTHORIZED, {
          message: `Sorry! This route is protected and can be accessed only by ${allowedRoles.join(
            ","
          )}.`,
        });
      }
    };
  },
};
