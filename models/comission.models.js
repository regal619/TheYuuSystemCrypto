const mongoose = require("mongoose");

const comissionSchema = new mongoose.Schema(
    {
        member_status: {
            type: String,
            enum: ["comission", "president"],
            default: "comission"
        },
        casting_last_day: {
            type: Date,
            default: null
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
    },
    { timestamps: true }
)

const Comission = mongoose.model("Comission", comissionSchema)
module.exports = Comission