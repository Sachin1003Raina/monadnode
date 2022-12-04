const { genchecksum, verifychecksum } = require("../helpers/checksum");
const https = require("https");
const checkError = require("../helpers/checkError");
const CustomError = require("../helpers/customError");
const Customer = require("../models/user");
const mongoose = require("mongoose");

async function paymentHandler(req, res, amount) {
  const orderId = new mongoose.Types.ObjectId();
  var params = {};

  let callbackUrl = `${process.env.CALLBACK_URL}/wallet/${req.user._id}`;

  params["MID"] = process.env.MERCHANT_ID;
  params["WEBSITE"] = process.env.MERCHANT_WEBSITE;
  params["CHANNEL_ID"] = "WEB";
  params["INDUSTRY_TYPE_ID"] = "Retail";
  params["ORDER_ID"] = orderId.toString();
  params["CUST_ID"] = `${req.user._id}`;
  params["TXN_AMOUNT"] = `${amount}`;
  params["CALLBACK_URL"] = callbackUrl;
  params["EMAIL"] = "devankan161pathak@gmail.com";
  params["MOBILE_NO"] = req.user.number;
  console.log("params", params);
  genchecksum(params, process.env.MERCHANT_KEY, (err, checksum) => {
    if (err) {
      console.log("Error: " + err);
    }

    let paytmParams = {
      ...params,
      CHECKSUMHASH: checksum,
    };
    console.log("webdata", paytmParams);
    res.json(paytmParams);
  });
}

async function callbackHandler(req, res, handlerFunction) {
  let session;
  try {
    let responseData = req.body;
    console.log(responseData);
    session = await mongoose.startSession();
    session.startTransaction();

    console.log("paymentRecieop", responseData);
    var checksumhash = responseData.CHECKSUMHASH;
    var result = verifychecksum(
      responseData,
      process.env.MERCHANT_KEY,
      checksumhash
    );
    if (result) {
      var paytmParams = {};
      paytmParams["MID"] = req.body.MID;
      paytmParams["ORDERID"] = req.body.ORDERID;

      /*
       * Generate checksum by parameters we have
       * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys
       */
      genchecksum(paytmParams, process.env.MERCHANT_KEY, (err, checksum) => {
        paytmParams["CHECKSUMHASH"] = checksum;

        var post_data = JSON.stringify(paytmParams);

        var options = {
          /* for Production */
          // hostname: "securegw.paytm.in",

          /* for development */
          hostname: "securegw-stage.paytm.in",

          port: 443,
          path: "/order/status",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": post_data.length,
          },
        };

        var response = "";
        var post_req = https.request(options, function (post_res) {
          post_res.on("data", function (chunk) {
            response += chunk;
          });

          post_res.on("end", async function () {
            let result = JSON.parse(response);
            console.log("result", result);
            if (result.STATUS === "TXN_SUCCESS") {
              //store in db
              const order = await handlerFunction(
                req,
                session,

                result.TXNAMOUNT,
                result.TXNID
              );
              await session.commitTransaction();

              res.redirect(`${process.env.WEB_URL}`);
            } else {
              res.redirect(`${process.env.WEB_URL}`);
            }
          });
        });

        post_req.write(post_data);
        post_req.end();
      });
    } else {
      session.commitTransaction();
      res.redirect(`${process.env.WEB_URL}/failure`);
      console.log("Checksum Mismatched");
    }
  } catch (err) {
    //@ts-ignore
    await session.abortTransaction();
    checkError(err, res);
  }
}

async function rechargeWalletHandler(req, res) {
  try {
    console.log("body", req.body);
    if (req.body.amount < 20) {
      throw new CustomError(
        "Bad request",
        404,
        "only amount greater than 20 can be recharged"
      );
    }
    await paymentHandler(
      req,
      res,

      Math.ceil(req.body.amount)
    );
  } catch (err) {
    checkError(err, res);
  }
}

async function rechargeWalletCallbackHandler(req, res) {
  console.log("request", req.body);
  await callbackHandler(req, res, rechargeWalletSuccessHandler);
}

async function rechargeWalletSuccessHandler(req, session, amount) {
  const customer = await Customer.findOne(
    {
      _id: req.params.userId,
    },
    {},
    { session }
  );

  if (!customer) {
    throw new CustomError(
      "Bad request",
      404,
      "No customer found with this number"
    );
  }
  customer.wallet += parseFloat(amount);
  await customer.save();
}

module.exports = { rechargeWalletHandler, rechargeWalletCallbackHandler };
