const express = require("express");
const { VerifyToken } = require("../helpers/AuthHelpers");
const {
  getSelfUser,
  signin,
  refreshToken,
  signout,
  signup,
  verifySignup,
  resetPassword,
  verifyResetPassword,
  resendVerificationLink,
  onGoogleSignin,
} = require("../controllers/auth/authController");
const {
  validateSignin,
  validateSignup,
  validateVerifySignup,
  validateResetPassword,
  validateVerifyResetPassword,
  validateResendVerificationLink,
  validateGoogleSignin,
} = require("../controllers/auth/authValidator");

const router = express.Router();

// Get self user details after login
router.route("/").get(VerifyToken, getSelfUser);

// Route used for signin
router.route("/signin").post(validateSignin, signin);

// for google sign in
router.route("/signin/google").post(validateGoogleSignin, onGoogleSignin);

// signup
router.route("/signup").post(validateSignup, signup);

// signup verify
router.route("/signup/verify/:token").put(validateVerifySignup, verifySignup);

// reset password
router.route("/reset-password").put(validateResetPassword, resetPassword);

// reset password verify
router
  .route("/reset-password/verify/:token")
  .put(validateVerifyResetPassword, verifyResetPassword);

// resend verification link
router
  .route("/resend-verification-link")
  .put(validateResendVerificationLink, resendVerificationLink);

// Refresh
router.route("/refresh").get(refreshToken);

// Signout
router.route("/signout").get(signout);

module.exports = router;
