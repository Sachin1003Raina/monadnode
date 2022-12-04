// import connect from "./src/database/connection";
require("dotenv").config();
const express = require("express");
const { connect } = require("./src/database/connection");
const morgan = require("morgan");
const userRouter = require("./src/routes/user");
const port = parseInt(process.env.PORT);
const start = async () => {
  try {
    await connect();
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(function (req, res, next) {
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Origin", req.headers.origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET,PUT,POST,DELETE,UPDATE,OPTIONS"
      );
      res.header(
        "Access-Control-Allow-Headers",
        "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept,Authorization"
      );
      next();
    });
    app.use(morgan("dev"));
    app.use("/user", userRouter);
    // app.use("/auth", authRoute);
    app.listen(port, () => {
      console.log("listening");
    });
  } catch (err) {
    console.log("error", err);
  }
};
start();
