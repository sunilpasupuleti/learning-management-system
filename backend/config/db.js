const mongoose = require("mongoose");
const logger = require("../middleware/logger/logger");
const Users = require("../models/Users");
const { lowercase } = require("../helpers/typography");
const bcrypt = require("bcrypt");

module.exports = () => {
  const DATABASE =
    process.env.NODE_ENV === "production"
      ? process.env.MONGO_DATABASE_PRODUCTION
      : process.env.MONGO_DATABASE_DEV;
  mongoose.connect(
    String(process.env.MONGO_DATABASE_URL).replace("<database>", DATABASE),
    {}
  );

  const db = mongoose.connection;
  db.on("error", logger.error.bind(logger, " Connection Error : ")),
    db.once("open", async () => {
      let superAdminExists = await Users.findOne({
        role: "superAdmin",
      });

      let hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      console.log(hashedPassword);

      if (!superAdminExists) {
        Users.create({
          firstName: "Datavalley",
          lastName: "Admin",
          name: process.env.ADMIN_NAME,
          email: lowercase(process.env.ADMIN_EMAIL),
          password: hashedPassword,
          role: "superAdmin",
          verified: true,
        })
          .then(() => {
            logger.info("Super Admin created successfully");
          })
          .catch((err) => console.log(err));
      }
      logger.info(`Database Connected (${db.name}) : ${db.host}`);
    });
};
