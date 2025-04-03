const jwt = require("jsonwebtoken");
const {
  getJwt,
  cryptoEncrypt,
  cryptoDecrypt,
  sendResponse,
  httpCodes,
} = require("../../helpers/utility");
const Users = require("../../models/Users");
const { lowercase, capitalize } = require("../../helpers/typography");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const FRONTEND_URL = process.env.FRONTEND_URL;

const { OAuth2Client } = require("google-auth-library");
const { smtpTransport } = require("../../helpers/mailHelpers");
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const cookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  path: "/",
};

const returnLoginCookies = (data, res) => {
  let accessToken = getJwt(data, "1h");
  accessToken = cryptoEncrypt(accessToken);
  let refreshToken = getJwt(data, "30d");
  refreshToken = cryptoEncrypt(refreshToken);
  console.log(accessToken, refreshToken);

  var accessTokenmaxAge = 1 * 60 * 60 * 1000;
  var refreshTokenmaxAge = 30 * 24 * 60 * 60 * 1000;
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: accessTokenmaxAge,
  });
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: refreshTokenmaxAge,
  });
};

const generateVerificationToken = () => {
  return crypto.randomBytes(20).toString("hex");
};

module.exports = {
  async getSelfUser(req, res) {
    let userData;
    const data = await Users.findOne({
      _id: req.user._id,
    }).populate("batches");

    const batchNames = data.batches.map((batch) => batch.name);
    const { _id, firstName, lastName, email, role, verified } = data;
    userData = {
      _id,
      firstName,
      lastName,
      email,
      role,
      verified,
      batchNames,
    };
    return sendResponse(res, httpCodes.OK, {
      message: "User Details",
      userData,
    });
  },

  async refreshToken(req, res) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      logger.error("No refresh token provided");
      return sendResponse(res, httpCodes.UNAUTHORIZED, {
        message: "No refresh token provided to send the access token",
      });
    }

    let refreshTokenCryptoDecrypted = cryptoDecrypt(refreshToken);
    return jwt.verify(
      refreshTokenCryptoDecrypted,
      process.env.JWT_SECRET,
      async (err, decoded) => {
        if (err) {
          if (err.expiredAt < new Date()) {
            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");
            logger.error("Refresh token expired");

            return sendResponse(res, httpCodes.UNAUTHORIZED, {
              message:
                "Your refresh token had expired! Please login again to continue",
              refreshToken: null,
            });
          }
          logger.error(err.message, " Error in refresh token function call");
          return sendResponse(res, httpCodes.UNAUTHORIZED, {
            message: "Refresh token error" + err.stack,
            refreshToken: null,
          });
        }
        let decodedData = decoded.data;

        let userData = await Users.findOne({ _id: decodedData._id });
        if (userData) {
          let accessToken = getJwt(userData, "1h");
          accessToken = cryptoEncrypt(accessToken);
          var accessTokenmaxAge = 1 * 60 * 60 * 1000;

          res.cookie("accessToken", accessToken, {
            ...cookieOptions,
            maxAge: accessTokenmaxAge,
          });

          return sendResponse(res, httpCodes.OK, {
            message: "access token received",
          });
        } else {
          return sendResponse(res, httpCodes.UNAUTHORIZED, {
            message: "No user found  ",
            result: false,
          });
        }
      }
    );
  },

  async signin(req, res) {
    const { email } = req.body;
    let signInData;

    var userData = await Users.findOne({
      email: lowercase(email),
    }).populate("batches");

    let { _id, firstName, lastName, email: em, role, verified } = userData;

    const batchNames = userData.batches.map((batch) => batch.name);
    signInData = {
      _id: _id,
      firstName: firstName,
      lastName: lastName,
      email: em,
      role: role,
      verified: verified,
    };

    returnLoginCookies(signInData, res);

    return sendResponse(res, httpCodes.OK, {
      message: "Login successfull",
      userData: signInData,
    });
  },

  async onGoogleSignin(req, res) {
    try {
      const { token } = req.body;
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      const { name, email } = payload;

      let userAlreadyExists = await Users.findOne({
        email: email,
        provider: { $ne: "google" },
      });

      if (userAlreadyExists) {
        throw "User Already Exists with same email-address, Please login with email and password method";
      }

      let firstName;
      let lastName;
      if (name) {
        let splited = name.split(" ");
        firstName = splited[0];
        lastName = splited[1];
      }
      firstName = firstName || "-";
      lastName = firstName || "-";
      let data = {
        email: email,
        firstName: capitalize(firstName),
        lastName: capitalize(lastName),
        provider: "google",
        verified: true,
      };

      let updatedUser = await Users.findOneAndUpdate(
        {
          email: email,
        },
        {
          $set: data,
        },
        {
          upsert: true,
          new: true,
        }
      );

      let {
        _id,
        firstName: fn,
        lastName: ln,
        email: em,
        role,
        verified,
        provider,
      } = updatedUser;

      let signInData = {
        _id: _id,
        firstName: fn,
        lastName: ln,
        email: em,
        role: role,
        verified: verified,
        provider: provider,
      };
      returnLoginCookies(signInData, res);
      return sendResponse(res, httpCodes.OK, {
        message: "Login successfull",
        userData: signInData,
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e,
      });
    }
  },

  async signup(req, res) {
    try {
      let { email, password, firstName, lastName } = req.body;
      email = lowercase(email);
      let hashedPassword = await bcrypt.hash(password, 10);
      let verificationToken = generateVerificationToken();
      let signupData = {
        email: email,
        firstName: capitalize(firstName),
        lastName: capitalize(lastName),
        password: hashedPassword,
        verificationToken: verificationToken,
      };

      const verificationLink = `${FRONTEND_URL}/auth/verify/${verificationToken}`;
      let mailOptions = {
        from: `LMS VERIFICATION <${process.env.SMTP_FROM}>`,
        to: email,
        subject: "Account Verification",
        text: `Click the following link to verify your account : ${verificationLink}`,
      };
      smtpTransport.sendMail(mailOptions, async (error, info) => {
        console.log(info, error);
        if (error) {
          return sendResponse(res, httpCodes.BAD_REQUEST, {
            message: error.toString(),
          });
        }
        await Users.create(signupData);
        return sendResponse(res, httpCodes.OK, {
          message:
            "Thank you for signing up! Your account verification link has been sent to your email. Click to verify and get started.",
        });
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async resendVerificationLink(req, res) {
    try {
      let { email } = req.body;
      email = lowercase(email);
      let verificationToken = generateVerificationToken();
      let data = {
        verificationToken: verificationToken,
      };
      const verificationLink = `${process.env.FRONTEND_URL}/auth/verify/${verificationToken}`;
      let mailOptions = {
        from: `LMS VERIFICATION <${process.env.SMTP_FROM}>`,
        to: email,
        subject: "Account Verification",
        text: `Click the following link to verify your account: ${verificationLink}`,
      };

      smtpTransport.sendMail(mailOptions, async (error, info) => {
        if (error) {
          throw error;
        }
        await Users.findOneAndUpdate(
          {
            email: email,
          },
          { $set: data }
        );
        return sendResponse(res, httpCodes.OK, {
          message:
            "Thank you ! Your account verification link has been sent to your email. Click to verify and get started.",
        });
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async verifySignup(req, res) {
    try {
      let verificationToken = req.params.token;

      await Users.findOneAndUpdate(
        {
          verificationToken: verificationToken,
        },
        {
          $set: {
            verified: true,
            verificationToken: null,
          },
        }
      );

      return sendResponse(res, httpCodes.OK, {
        message: "Account Verified Successfully",
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async resetPassword(req, res) {
    try {
      let { email } = req.body;
      email = lowercase(email);
      let resetPasswordToken = generateVerificationToken();
      let data = {
        resetPasswordToken: resetPasswordToken,
        resetPasswordTokenExpires: Date.now() + 5 * 60 * 1000,
      };
      const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password/${resetPasswordToken}`;
      let mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: "Password Reset Request",
        text: `Click the following link to reset your password: ${resetLink}`,
      };
      res.cookie("accessToken", "", { ...cookieOptions, expires: new Date(0) });
      res.cookie("refreshToken", "", {
        ...cookieOptions,
        expires: new Date(0),
      });

      smtpTransport.sendMail(mailOptions, async (error, info) => {
        if (error) {
          throw error;
        }
        await Users.findOneAndUpdate(
          {
            email: email,
          },
          {
            $set: data,
          }
        );
        return sendResponse(res, httpCodes.OK, {
          message:
            "Your account Password reset link has been sent to your email. Click to verify and get started.",
        });
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async verifyResetPassword(req, res) {
    try {
      let resetPasswordToken = req.params.token;

      let { password } = req.body;
      let hashedPassword = await bcrypt.hash(password, 10);

      await Users.findOneAndUpdate(
        {
          resetPasswordToken: resetPasswordToken,
        },
        {
          $set: {
            resetPasswordToken: null,
            resetPasswordTokenExpires: undefined,
            password: hashedPassword,
          },
        }
      );

      return sendResponse(res, httpCodes.OK, {
        message: "Password updated successfully",
      });
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },

  async signout(req, res) {
    try {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return sendResponse(res, httpCodes.OK, { message: "logged out" });
    } catch (e) {
      logger.info("err", e);
    }
  },
};
