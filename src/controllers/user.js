const CustomError = require("../helpers/customError");
const Customer = require("../models/user");
const checkError = require("../helpers/checkError");
const SendOtp = require("../helpers/sendOtp");

async function createCustomerHandler(req, res) {
  try {
    const code = Math.round(Math.random() * 8999 + 1000);
    const phone = req.body.number;
    console.log("body", req.body);
    const customer = await Customer.findOne({ number: phone }, { _id: 1 });
    console.log("customer", customer);
    if (customer) {
      throw new CustomError("Bad Request", 404, "Number already exists");
    }
    await SendOtp(code, phone);

    await Customer.create({
      ...req.body,
      code,
      codeValid: true,
    });

    res.status(201).send({
      message: "we send you a otp please enter here to verify your number",
    });
  } catch (err) {
    checkError(err, res);
  }
}

async function verifyCustomerHandler(req, res) {
  try {
    console.log(req.body);
    const customer = await Customer.findOneAndUpdate(
      { number: req.body.number, codeValid: true, code: req.body.code },
      { $set: { codeValid: false } },
      {}
    );
    console.log(customer);
    if (!customer) {
      throw new CustomError("Bad credentials", 400, "please provide valid otp");
    }
    const token = await customer.generateAuthToken(req.body.webToken);
    res.status(200).send({ user: customer, token });
  } catch (err) {
    checkError(err, res);
  }
}

async function loginCustomerHandler(req, res) {
  try {
    const customer = await Customer.findByCredentials(
      req.body.number,
      req.body.password
    );
    if (!customer) {
      throw new CustomError(
        "Bad request",
        404,
        "Please Provide Right Credientials"
      );
    }
    const token = await customer.generateAuthToken(req.body.webToken);

    res.send({ user: customer, token });
  } catch (err) {
    checkError(err, res);
  }
}

async function getStatusHandler(req, res) {
  try {
    res.send(req.user);
  } catch (err) {
    checkError(err, res);
  }
}
async function getWalletHandler(req, res) {
  try {
    res.send({ wallet: req.user.wallet, logs: [] });
  } catch (err) {
    checkError(err, res);
  }
}

module.exports = {
  loginCustomerHandler,
  getStatusHandler,
  verifyCustomerHandler,
  getWalletHandler,
  createCustomerHandler,
};
