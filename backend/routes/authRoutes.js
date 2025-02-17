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

/**
 * @swagger
 * /auth:
 *   get:
 *     summary: Get self-user details after login
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: User details retrieved
 *       401:
 *         description: Unauthorized - Token missing or expires
 */
router.route("/").get(VerifyToken, getSelfUser);

/**
 * @swagger
 * /auth/signin:
 *   post:
 *     summary: User Sign-in
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully signed in
 */
router.route("/signin").post(validateSignin, signin);

// for google sign in
router.route("/signin/google").post(validateGoogleSignin, onGoogleSignin);

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: User Sign-up
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User successfully registered
 */
router.route("/signup").post(validateSignup, signup);

/**
 * @swagger
 * /auth/signup/verify/{token}:
 *   put:
 *     summary: Verify user signup
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account verified successfully
 *       400:
 *         description: Invalid or expired verification token
 */
router.route("/signup/verify/:token").put(validateVerifySignup, verifySignup);

/**
 * @swagger
 * /auth/reset-password:
 *   put:
 *     summary: Reset user password
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset password link sent to email
 *       400:
 *         description: Email not found
 */
router.route("/reset-password").put(validateResetPassword, resetPassword);

/**
 * @swagger
 * /auth/reset-password/verify/{token}:
 *   put:
 *     summary: Verify reset password token
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired reset token
 */
router
  .route("/reset-password/verify/:token")
  .put(validateVerifyResetPassword, verifyResetPassword);

/**
 * @swagger
 * /auth/resend-verification-link:
 *   put:
 *     summary: Resend email verification link
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification link resent
 *       400:
 *         description: Email not found or already verified
 */
router
  .route("/resend-verification-link")
  .put(validateResendVerificationLink, resendVerificationLink);

// Refresh
router.route("/refresh").get(refreshToken);

/**
 * @swagger
 * /auth/signout:
 *   get:
 *     summary: Sign out user
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Successfully signed out
 *       400:
 *         description: User not signed in
 */
router.route("/signout").get(signout);

module.exports = router;
