const mongoose = require("mongoose");

const top100MembersSchema = new mongoose.Schema(
    {
        full_name: {
            type: String,
            required: true
        },
        investment: {
            type: Number,
            required: true
        },
        votes: {
            type: Number,
            default: 0,
        },
        vote_status: {
            type: String,
            default: "pending"
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
    },
    { timestamps: true }
)

const Top100Members = mongoose.model("Top100Members", top100MembersSchema)
module.exports = Top100Members