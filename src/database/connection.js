const mongoose = require("mongoose");

function connect() {
  return mongoose
    .connect(process.env.DB_URI, {})
    .then(() => {
      console.log("Database connected");
    })
    .catch((error) => {
      console.error("db error", error);
      process.exit(1);
    });
}

module.exports = { connect };
