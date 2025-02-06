const envPath =
  process.env.SERVER === "datavalley"
    ? __dirname + `/config/.env.datavalley`
    : __dirname + `/config/.env`;

require("dotenv").config({ path: envPath });
const express = require("express");
const cors = require("cors");
const moment = require("moment");
const logger = require("./middleware/logger/logger");
const connectDB = require("./config/db");
const morgan = require("morgan");
const app = express();
const fs = require("fs");
const rfs = require("rotating-file-stream");
const path = require("path");
const cookieParser = require("cookie-parser");
const { initSocket } = require("./sockets/socketManager");
const { dbBackup, sendBackupMessage } = require("./config/dbBackup");
const schedule = require("node-schedule");
/**
 * Morgon
 */
let logsPath = __dirname + "/logs";
if (!fs.existsSync(logsPath)) {
  fs.mkdirSync(logsPath);
}

let apiLogsPath = __dirname + "/logs/api.log";
if (!fs.existsSync(apiLogsPath)) {
  fs.writeFileSync(apiLogsPath, "");
}
// Create rotating write stream
var accessLogStream = rfs.createStream("api.log", {
  interval: "1d",
  path: path.join(process.env.LOGPATH),
});

app.use(
  morgan("dev", {
    skip: (req, res) => req.method === "OPTIONS",
  })
);

// app.use(
//   morgan("combined", {
//     stream: accessLogStream,
//     skip: (req, res) => req.method === "OPTIONS",
//   })
// );

/**
 * Connect to database
 */
connectDB();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN_URL.split(","),
    credentials: true,
    allowedHeaders: [
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Headers",
      "Content-Type",
      "Authorization",
      "x-csrf-token",
      "Accept",
      "form-data",
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

/**
 * Serve Static files
 */

let debugLogsPath = path.join(
  __dirname + `/logs/debug-${moment().format("MM-DD-YYYY")}.log`
);
let errorLogsPath = path.join(
  __dirname + `/logs/error-${moment().format("MM-DD-YYYY")}.log`
);

app.use("/public", express.static(__dirname + "/public"));
app.use("/logs", express.static(__dirname + "/logs"));
app.use("/logs/server", express.static(debugLogsPath));
app.use("/logs/error", express.static(errorLogsPath));

/**
 * Routes
 */

app.use("/", require("./routes/index"));

let job;

/**
 * Error handling
 */
process.on("uncaughtException", (error, promise) => {
  logger.error("----- uncaught exception  -----");
  logger.error(error.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("----- Reason -----");
  logger.error(reason);
});

process.on("SIGINT", function () {
  schedule.gracefulShutdown().then(() => process.exit(0));
  if (job) {
    job.cancel();
  }
  process.exit();
});
/**
 * Create Server
 */

const server = require("http").Server(app);

const io = initSocket(server);
require("./sockets/socket")(io);

server.listen(process.env.PORT || 8080, async () => {
  logger.info(`server started on port number ${process.env.PORT} }`);
  let pattern = "0 0 */4 * * *"; //for every 4 hours
  // let pattern = "*/1 * * * *";
  job = schedule.scheduleJob(pattern, async () => {
    try {
      console.log("Running Database backup task...");
      await dbBackup(); // Call your backup task function here
      console.log("Backup Completed Successfully..");
      sendBackupMessage("success");
    } catch (e) {
      let message = `Database backup error  : ${e.toString()}`;
      console.error(message);
      sendBackupMessage("error", message);
    }
  });
});
