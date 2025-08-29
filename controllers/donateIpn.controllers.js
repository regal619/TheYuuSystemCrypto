const User = require("../models/user.models.js");
const { asyncHandler } = require("../utils/asyncHandler.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { login, register } = require("../validations/user.validations.js");
const { default: axios } = require("axios");
const Transactions = require("../models/transactions.models.js");
const crypto = require("crypto");

const donateIpn = asyncHandler(async (req, res) => {

    const signature = req.header("x-nowpayments-sig"); // HMAC-SHA512
    const sortObject = (obj) =>
        Object.keys(obj)
            .sort()
            .reduce((r, k) => {
                r[k] = obj[k] && typeof obj[k] === "object" ? sortObject(obj[k]) : obj[k];
                return r;
            }, {});
    const sorted = sortObject(req.body);
    const computed = crypto
        .createHmac("sha512", process.env.NOW_IPN_SECRET)
        .update(JSON.stringify(sorted))
        .digest("hex");

    if (computed !== signature) {
        return res.status(400).send("Invalid signature");
    }

    // Yahan req.body.status, payment_id, price_amount, pay_address, etc. milte hain
    // statuses: waiting, confirming, confirmed/paid, finished, expired...
    // TODO: apni DB me order ko update karo based on status
    console.log("IPN verified:", req.body);
    const transaction = await Transactions.findOneAndUpdate(
        { order_id: req.body.order_id },
        { ...req.body },
        { new: true }
    );
    if (!transaction) {
        return res.status(404).send("Transaction not found");
    }
    // await Transactions.create({
    //     ...req.body,
    // });

    return res.status(200).json(new ApiResponse(200, { body: req.body }, "Transaction updated."))
})

module.exports = { donateIpn }