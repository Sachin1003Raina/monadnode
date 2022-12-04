const jwt = require("jsonwebtoken");
const Customer = require("../models/user");
const checkError = require("../helpers/checkError");
const CustomError = require("../helpers/customError");

const authRequired = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    console.log("token", token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await Customer.findOne({
      _id: decoded._id,

      "tokens.token": token,
    });

    if (!user) {
      throw new CustomError("Bad request", 401, "Please Authenticate first");
    }

    req.token = token;

    req.user = user;
    //@ts-ignore
    req.id = decoded._id;

    // console.log("user", user);
    next();
  } catch (err) {
    checkError(err, res);
  }
};

module.exports = authRequired;
