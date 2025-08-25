const User = require("../models/user.models.js");
const { asyncHandler } = require("../utils/asyncHandler.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { login, register } = require("../validations/user.validations.js");
const { default: axios } = require("axios");
const Transactions = require("../models/transactions.models.js");

const getAllTransactions = asyncHandler(async (req, res) => {
    // const transactions = await Transactions.find({}).sort({ createdAt: -1 })
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const today_investments = await Transactions.aggregate([
        {
            $match: {
                payment_status: "finished",
                createdAt: {
                    $gte: today,
                    $lt: tomorrow
                }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$price_amount" }
            }
        },
    ]);
    const total_investments = await Transactions.aggregate([
        { $match: { payment_status: "finished" } },
        { $group: { _id: null, total: { $sum: "$price_amount" } } }
    ]);
    const transactions = await Transactions.aggregate([
        { $match: { payment_status: "finished" } },
        {
            $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user"
            }
        },
        { $unwind: "$user" },
        {
            $project: {
                _id: 0,
                user_id: "$user._id",
                full_name: "$user.full_name",
                price_amount: 1,
                price_currency: 1,
                order_id: 1,
                order_description: 1,
                createdAt: 1,
                updatedAt: 1,
                invoice_id: 1,
            }
        },
        { $sort: { createdAt: -1 } }

    ]);
    return res.status(200).json(new ApiResponse(200, { transactions, today_investments, total_investments }, "Transactions fetched successfully"))
})

const getUserTransactions = asyncHandler(async (req, res) => {
    const total_amount = await Transactions.aggregate([
        { $match: { user_id: req.user._id, payment_status: "finished" } },
        { $group: { _id: null, total: { $sum: "$price_amount" } } }
    ]);
    const transactions = await Transactions.find({ user_id: req.user._id, payment_status: "finished" }).sort({ createdAt: -1 })
    return res.status(200).json(new ApiResponse(200, { transactions, total_amount }, "User is registered successfully"))
})

const getTransactions = asyncHandler(async (req, res) => {  // by rankings
    // Aggregate transactions by user_id and sort by total_amount descending
    const transactions = await Transactions.aggregate([
        {
            $match: { payment_status: "finished" }
        },
        {
            $group: {
                _id: "$user_id",
                total_amount: { $sum: "$price_amount" },
                total_transactions: { $sum: 1 },
                transactions: { $push: "$$ROOT" }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $unwind: "$user"
        },
        {
            $project: {
                _id: 0,
                user_id: "$_id",
                full_name: "$user.full_name",
                total_amount: 1,
                total_transactions: 1,
                transactions: 1
            }
        },
        {
            $sort: { total_amount: -1 }
        }
    ]);

    return res.status(200).json(new ApiResponse(200, { transactions }, "Transactions summary by user"));
});

const createTransaction = asyncHandler(async (req, res) => {
    console.log(req.body);

    const { amount, currency = "usd", orderId, note } = req.body

    const payload = {
        price_amount: amount,                // e.g. 10.00
        price_currency: currency,            // "usd", etc.
        order_id: orderId || `don-${Date.now()}`,
        order_description: note || "Donation",
        ipn_callback_url: `${process.env.BASE_URL}/transactions/donate/ipn`,
        success_url: `${process.env.FRONTEND_URL}/#/payement/success`,
        cancel_url: `${process.env.FRONTEND_URL}/#/payement/cancelled`
    };
    console.log("transaction payload: ", payload);

    const { data } = await axios.post(
        "https://api.nowpayments.io/v1/invoice",
        payload,
        { headers: { "x-api-key": process.env.NOW_API_KEY } }
    );

    await Transactions.create({
        order_id: data.order_id,
        invoice_id: data.id,
        price_amount: data.price_amount,
        price_currency: data.price_currency,
        pay_currency: data.pay_currency, // e.g. "usd"
        order_description: data.order_description,
        invoice_url: data.invoice_url,
        user_id: req.user._id,
    });

    return res.status(200).json(new ApiResponse(200, { invoiceUrl: data.invoice_url, invoice: data }, "User is registered successfully"))
})

const successTransaction = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, {}, "Thanks! We received your submission. We'll confirm shortly."))
})

const cancelTransaction = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, {}, "Transaction canceled."))
})

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

module.exports = { getTransactions, getAllTransactions, getUserTransactions, createTransaction, successTransaction, cancelTransaction, donateIpn }