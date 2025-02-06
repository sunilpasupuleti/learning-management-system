const { lowercase } = require("../../helpers/typography");
const { sendResponse, httpCodes } = require("../../helpers/utility");
const Users = require("../../models/Users");
const bcrypt = require("bcrypt");

module.exports = {
  async validateSignin(req, res, next) {
    const { email, password } = req.body;
    if (!email) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Email required",
      });
    }

    if (!password) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Password required",
      });
    }

    let user = await Users.findOne({
      email: lowercase(email),
    });

    if (!user) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Invalid email",
      });
    }

    if (user.provider === "google") {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message:
          "This account uses Google Authentication, Please sign in with google",
      });
    }

    const passwordIsValid = await bcrypt.compare(password, user.password);

    if (!passwordIsValid) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Incorrect password",
      });
    }

    if (!user.verified) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "User not verified",
        status: "notVerified",
      });
    }

    next();
  },

  async validateGoogleSignin(req, res, next) {
    const { token } = req.body;
    if (!token) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Token required",
      });
    }

    next();
  },

  async validateSignup(req, res, next) {
    const { email, password, firstName, lastName } = req.body;
    if (!email) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Email required",
      });
    }

    if (!firstName) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "First Name required",
      });
    }

    if (!lastName) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Last Name required",
      });
    }

    if (!password) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Password required",
      });
    }

    let userExists = await Users.findOne({
      email: lowercase(email),
    });

    if (userExists) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Email-Id is already registered with another account!",
      });
    }

    next();
  },

  async validateVerifySignup(req, res, next) {
    const verificationToken = req.params.token;
    if (!verificationToken) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "No verification token found",
      });
    }

    let user = await Users.findOne({
      verificationToken: verificationToken,
    });

    if (!user) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Invalid verification token",
      });
    }

    next();
  },

  async validateResendVerificationLink(req, res, next) {
    const email = req.body.email;
    if (!email) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Email required",
      });
    }

    let user = await Users.findOne({
      email: lowercase(email),
    });

    if (!user) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "No User Found",
      });
    }

    next();
  },

  async validateResetPassword(req, res, next) {
    const { email } = req.body;
    if (!email) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Email required",
      });
    }

    let user = await Users.findOne({
      email: lowercase(email),
    });

    if (!user) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "No User Found",
      });
    }

    next();
  },

  async validateVerifyResetPassword(req, res, next) {
    const resetPasswordToken = req.params.token;
    let password = req.body.password;
    if (!resetPasswordToken) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "No Reset token found",
      });
    }

    if (!password) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Password required",
      });
    }

    let user = await Users.findOne({
      resetPasswordToken: resetPasswordToken,
      resetPasswordTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Invalid or expired Reset Password token",
      });
    }

    next();
  },
};
