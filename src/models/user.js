const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const CustomError = require("../helpers/customError");

var customerSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    number: {
      type: String,
      min: 10,
      trim: true,
      unique: true,
      index: "true",
    },
    password: {
      type: String,
      min: 8,
      trim: true,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error("password cannot contain password");
        }
      },
    },
    tokens: [
      {
        token: {
          type: String,
        },
      },
    ],
    wallet: { type: Number, default: 0 },
    code: { type: Number, required: true },
    codeValid: { type: Boolean, required: true },
  },
  {
    timestamps: true,
  }
);

customerSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 180, partialFilterExpression: { codeValid: true } }
);

customerSchema.statics.findByCredentials = async function (number, password) {
  const customer = await Customer.findOne({ number });
  console.log(customer);
  if (!customer) {
    throw new CustomError("Bad credentials", 404, "No such user found");
  }
  const isMatch = await bcrypt.compare(password, customer.password);
  if (!isMatch) {
    throw new CustomError("Bad credentials", 404, "Password is incorrect");
  }
  return customer;
};

customerSchema.methods.generateAuthToken = async function () {
  const customer = this;
  const token = jwt.sign(
    { _id: customer._id.toString() },
    process.env.JWT_SECRET
  );

  customer.tokens = customer.tokens.concat({ token });
  customer.codeValid = false;
  await customer.save();
  return token;
};

customerSchema.pre("save", async function (next) {
  const customer = this;
  if (customer.isModified("password")) {
    customer.password = await bcrypt.hash(customer.password, 8);
  }
  next();
});

const Customer = mongoose.model("Customer", customerSchema);
module.exports = Customer;
