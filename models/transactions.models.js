const mongoose = require('mongoose');

const transactionsSchema = new mongoose.Schema(
    {
        order_id: {
            type: String,
            required: true,
        },
        invoice_id: {
            type: String,
            required: true,
        },
        price_amount: {
            type: Number,
            required: true,
        },
        price_currency: {
            type: String,
            required: true,
        },
        order_description: {
            type: String,
            required: true,
        },
        pay_currency: {
            type: String,
            default: null,
        },
        invoice_url: {
            type: String,
            required: true,
        },
        pay_amount: {
            type: Number,
            default: null
        },
        payment_id: {
            type: String,
            default: null
        },
        pay_address: {
            type: String,
            default: null
        },
        purchase_id: {
            type: String,
            default: null
        },
        amount_received: {
            type: Number,
            default: null
        },
        payin_extra_id: {
            type: String,
            default: null
        },
        smart_contract: {
            type: String,
            default: ""
        },
        network: {
            type: String,
            default: ""
        },
        network_precision: {
            type: Number,
            default: null
        },
        time_limit: {
            type: Number,
            default: null
        },
        burning_percent: {
            type: Number,
            default: null
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        payment_status: {
            type: String,
            default: "pending"
        },
    },
    { timestamps: true }
)

const Transactions = mongoose.model("Transactions", transactionsSchema)
module.exports = Transactions