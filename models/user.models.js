
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        user_name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        full_name: {
            type: String,
            required: true,
            index: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        refreshToken: {
            type: String,
        },
        verificationCode: {
            type: String,
            default: ""
        },
        isVerified: {
            type: Boolean,
            default: "false"
        },
        isVoted: {
            type: Boolean,
            default: "false"
        },
        status: {
            type: Number,
            enum: [0, 1],
            default: 1
        },
    },
    { timestamps: true }
)

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next()
})

userSchema.pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate();

    if (update.password) {
        const hashed = await bcrypt.hash(update.password, 10);
        update.password = hashed;
    }
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullName: this.fullName,
            isAdmin: this.isAdmin,
            user_id: this.user_id,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

const User = mongoose.model("User", userSchema)
module.exports = User