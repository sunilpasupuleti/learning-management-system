const nodemailer = require("nodemailer");

let transportOptions =
  process.env.SERVER === "datavalley"
    ? {
        service: "gmail",
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      }
    : {
        host: process.env.SMTP_HOST,
        // port: process.env.SMTP_PORT,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          ciphers: "SSLv3",
          rejectUnauthorized: false,
        },
      };

const smtpTransport = nodemailer.createTransport(transportOptions);

module.exports = {
  transportOptions,
  smtpTransport,
};
