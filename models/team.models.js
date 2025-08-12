const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        participants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Participant',
            required: true
        }],
        church: {
            type: String,
            required: true
        },
        generalGroup: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            default: null
        },
        activity_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        sub_admin_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    { timestamps: true }
)

const Team = mongoose.model("Team", teamSchema)
module.exports = Team