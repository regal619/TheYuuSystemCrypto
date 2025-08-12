const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        gradeGroup: {
            type: String,
            required: true,
        },
        generalGroup: {
            type: String,
            required: true,
        },
        submission_date: {
            type: Date,
            required: true,
        },
        min_players: {
            type: Number,
            required: true,
        },
        max_players: {
            type: Number,
            required: true,
        },
        // total_players: {
        //     type: Number,
        //     required: true,
        // },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        sub_admin_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        status: {
            type: Number,
            enum: [0, 1],
            default: 1
        },
    },
    { timestamps: true }
)

const Activity = mongoose.model("Activity", activitySchema)
module.exports = Activity