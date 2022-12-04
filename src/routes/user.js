const express = require("express");
const {
  rechargeWalletHandler,
  rechargeWalletCallbackHandler,
} = require("../controllers/payment");
const userRouter = express.Router();
const {
  createCustomerHandler,
  verifyCustomerHandler,
  loginCustomerHandler,
  getStatusHandler,
  getWalletHandler,
} = require("../controllers/user");
const authRequired = require("../middleware/auth");

userRouter.post("/signup", createCustomerHandler);

userRouter.post("/signup/verify", verifyCustomerHandler);

userRouter.get("/status", authRequired, getStatusHandler);

userRouter.get("/wallet", authRequired, getWalletHandler);

userRouter.post("/login", loginCustomerHandler);

userRouter.post("/recharge/wallet", authRequired, rechargeWalletHandler);

userRouter.post(
  "/callback/wallet/:userId",

  rechargeWalletCallbackHandler
);

module.exports = userRouter;
