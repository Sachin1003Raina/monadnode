const axios = require("axios");

async function SendOtp(code, number = "7050117707") {
  let key = "NDgzNTM1NTk2NzRiNmQ0ZjY4MzQ0MjZmNzMzNDMyNzY=";

  let msg = `Your%20OTP%20is%20:%20${code}%nVenido%20cab%20services`;

  const response = await axios({
    headers: { "content-type": "application/json" },
    url: `https://api.textlocal.in/send/?apiKey=${key}&sender=VENIDO&numbers=91${number}&message=${msg}`,
  });
}

module.exports = SendOtp;
