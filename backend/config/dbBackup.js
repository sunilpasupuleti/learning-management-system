const path = require("path");
const fs = require("fs");
const util = require("util");
const moment = require("moment");
const { spawn } = require("child_process");
const schedule = require("node-schedule");
const { uploadSingleToS3 } = require("../helpers/s3Helpers");
const { smtpTransport } = require("../helpers/mailHelpers");

module.exports = {
  async dbBackup() {
    const backupDirPath = path.join(__dirname, "../mongodb-backups/");
    return new Promise(async (resolve, reject) => {
      try {
        if (!fs.existsSync(backupDirPath)) {
          await fs.mkdirSync(backupDirPath, { recursive: true });
        }
        const DATABASE_URL = process.env.MONGO_DATABASE_URL;
        const mongoUri = DATABASE_URL.match(/mongodb\+srv:\/\/[^/]+/)[0];
        console.log(mongoUri, "---");
        const timestamp = moment().format("MMM-DD-YYYY_HH-mm-ss");
        const backupFileName = `${timestamp}.gz`;
        const backupPath = path.join(backupDirPath, backupFileName);
        const dumpProcess = spawn("mongodump", [
          "--uri=" + mongoUri, // Ensure that uri is properly formatted
          "--archive=" + backupPath,
          "--gzip",
        ]);
        // Handle the end event to know when the backup is complete
        dumpProcess.stdout.on("end", async () => {
          let buffer = await fs.readFileSync(backupPath);
          let fileData = {
            buffer: buffer,
            mimetype: "application/gzip",
            path: "mongodb-backups/" + backupFileName,
          };
          await uploadSingleToS3(fileData, () => {});
          await fs.unlinkSync(backupPath);
          resolve(true);
        });

        dumpProcess.stdout.on("data", (data) => {
          console.log(data.toString());
        });

        dumpProcess.stdout.on("error", (data) => {
          console.error("Error : ", data.toString());
          throw data;
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  async sendBackupMessage(status, message = "") {
    let email = "sunil.pandvd22@gmail.com";
    let text =
      status === "success"
        ? "Your database backup was successful. Thank you for keeping your data secure!"
        : "We encountered an issue while attempting to back up your database. Our team is investigating the problem. We apologize for any inconvenience caused. Please contact support for further assistance.";
    text += ` ${message}`;
    let ADMIN_EMAILS = process.env.ADMIN_EMAILS;
    ADMIN_EMAILS = ADMIN_EMAILS.split(",");
    let mailOptions = {
      from: `LMS DB BACKUP <${process.env.SMTP_FROM}>`,
      to: ADMIN_EMAILS,
      subject: "DB Backup Status",
      text: text,
    };

    smtpTransport.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.log("Error in sending email : " + email);
        throw error;
      }
      console.log("Final Db Status - " + status);
    });
  },
};
