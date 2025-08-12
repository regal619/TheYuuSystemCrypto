const mongoose = require('mongoose');

const participantsSchema = new mongoose.Schema(
    {
        image: {
            type: String,
            required: true,
        },
        submission_date: { type: String, alias: "Submission Date" },
        testCode: { type: String, alias: "Your Test Code#" },
        bible_test: { type: String },
        access_code: { type: String },
        todayDate: { type: String, alias: "Today Date" },
        firstName: { type: String, alias: "First Name" },
        lastName: { type: String, alias: "Last Name" },
        full_name: { type: String },
        dateOfBirth: { type: String, alias: "Date of Birth" },
        phoneNumber: { type: String, alias: "Phone Number" },
        email: { type: String, alias: "Email" },
        streetAddress: { type: String, alias: "Street Address" },
        state: { type: String, alias: "State" },
        zipCode: { type: mongoose.Schema.Types.Mixed, alias: "Zip Code" },
        grade: { type: String, alias: "Grade" },
        gradeGroup: { type: String, alias: "Grade Group" },
        gender: { type: String, alias: "Gender" },
        church: { type: String, alias: "Church" },
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

const Participants = mongoose.model("Participants", participantsSchema)
module.exports = Participants