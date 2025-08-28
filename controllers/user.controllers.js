const User = require("../models/user.models.js");
const { asyncHandler } = require("../utils/asyncHandler.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { login, register } = require("../validations/user.validations.js");
const sendEmail = require("../utils/Email.js");
const jwt = require("jsonwebtoken");
const Transactions = require("../models/transactions.models.js");

// const backHost = process.env.Backend_HOST
// const frontHost = process.env.Frontend_HOST
const backHost = process.env.BASE_URL
const frontHost = process.env.FRONTEND_URL

function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000);
}

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while creating accessToken and refreshToken")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    console.log(req.body);
    console.log("Registering user...");


    const { email, user_name } = req.body
    const { error, value } = register.body.validate(req.body);

    if (error) {
        return res.status(400).send(new ApiError(400, error.details[0].message))
    }

    const isUserExist = await User.findOne({
        $or: [
            { email },
            { user_name }
        ]
    });
    console.log("isUserExist", isUserExist);


    if (isUserExist) {
        return res.status(409).send(new ApiError(409, "This user already exists"))
    }

    let user = await User.create({
        ...req.body,
        // coordinators: 1,
        // activity: 1,
        // isAdmin: true
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        return res.status(500).send(new ApiError(500, "Something went wrong while registering user"))
    }

    // const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const code = generateVerificationCode();
    const verificationCode = { "verificationCode": code }
    user = await User.findByIdAndUpdate(user.id, verificationCode, { new: true })

    // Send Email
    // const link = `${backHost}/api/user/verify/${user._id}/${user.userToken}`
    const subject = `Verify Your Yuu System Email Address`
    const message = `<p>Thanks for signing up with The Yuu System! Use the verification code below to verify your email:</p>
    
        <h2 style="color:#2c3e50;">${code}</h2>
        
        <p>If you did not sign up for The Yuu System account,
        you can safely ignore this email. Have fun, and don't hesitate to contact us with your feedback.</p>
        
        <p>Best regards,<br>The Yuu System</p>`

    await sendEmail(user.email, subject, message)

    return res.status(200).json(new ApiResponse(200, { status: "otp" }, "A verification code is sent to your email, please verify to activate your account"))
})

// Route 2: verify user using POST "/api/v1/auth/verify"
const verifyEmail = async (req, res) => {
    try {
        // const { id, token } = req.params
        console.log("Verifying email...");

        const { email, code } = req.body
        let user = await User.findOne({ email })
        if (!user) { return res.status(400).json({ message: "Email is Invalid" }) }

        let verifycode = await User.findOne({ email, verificationCode: code })
        if (!verifycode) { return res.status(400).json({ message: "Email or verification Code is invalid!" }) }

        const verified = { "isVerified": "true" }
        user = await User.findByIdAndUpdate(verifycode._id, verified, { new: true })

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

        // res.redirect(`${frontHost}/`)

        return res.status(200).json(new ApiResponse(200, { accessToken }, "Email is verified successfully!"))

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Server error" });
    }
}

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    const { error } = login.body.validate(req.body);

    if (error) {
        return res.status(400).send(new ApiError(400, error.details[0].message))
    }

    let user = await User.findOne({
        $or: [
            { email: email },
            { user_name: email }
        ]
    })

    if (!user) {
        return res.status(404).send(new ApiError(404, "User not found"))
    }

    if (user.status === 0) {
        return res.status(404).send(new ApiError(404, "User's account is deleted!"))
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if (!isPasswordCorrect) {
        return res.status(401).send(new ApiError(401, "Invalid user credentials"))
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const code = generateVerificationCode();
    const verificationCode = { "verificationCode": code }
    user = await User.findByIdAndUpdate(user.id, verificationCode, { new: true })

    // if (!user.isVerified) {
    // Send Email
    // const link = `${backHost}/api/user/verify/${user._id}/${user.userToken}`
    const subject = `The Yuu System Signin Verification`
    const message = `<p>We received a request to sign in to your The Yuu System account. Use the verification code below to complete your sign-in:</p>
  
        <h2 style="color:#2c3e50;">${code}</h2>
    
        <p>If you did not request this sign-in, you can safely ignore this email. Your account will remain secure.</p>
        
        <p>Best regards,<br>The Yuu System</p>`
    await sendEmail(user.email, subject, message)

    return res.status(200).json(new ApiResponse(200, { status: "otp" }, "A verification code is sent to your email, please verify to login to your account"))
    // }

    // return res.status(200).json(new ApiResponse(200, { accessToken }, "User logged in successfully"))
})

const getUser = asyncHandler(async (req, res) => {
    // const total_investments = await Transactions.countDocuments({})
    const total_investments = await Transactions.aggregate([
        { $match: { payment_status: "finished" } },
        { $group: { _id: null, total: { $sum: "$price_amount" } } }
    ]);
    // const active_members = await User.countDocuments({ status: 1 })


    const uniqueUsers = await Transactions.distinct("user_id", { payment_status: "finished" });
    const active_members = uniqueUsers.length==0?0:uniqueUsers.length ;

    return res.status(200).send(new ApiResponse(200, { user: req.user, total_investments, active_members }, "User fetched successfully"))
})

const updatePassword = asyncHandler(async (req, res) => {
    const user_id = req.user._id
    const { password } = req.body

    if (!password || password.length < 8) {
        return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
    }

    const user = await User.findById(user_id);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found." });
    }

    user.password = password;
    await user.save();

    return res.status(200).send(new ApiResponse(200, req.user, "User password is updated successfully"))
})

const updateProfile = asyncHandler(async (req, res) => {
    const user_id = req.user._id
    const { full_name } = req.body

    if (!full_name) {
        return res.status(400).json({ success: false, message: "Name field is required" });
    }

    const user = await User.findById(user_id);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found." });
    }

    user.full_name = full_name;
    await user.save();

    return res.status(200).send(new ApiResponse(200, req.user, "Profile is updated successfully!"))
})

// Route: Forgot password using POST "/auth/forgot-password"
const forgotPassword = asyncHandler(async (req, res) => {

    const { email } = req.body
    let user = await User.findOne({ email })
    if (!user) { return res.status(404).send(new ApiError(404, "User not found")) }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    // send email
    // const link = `${backHost}/api/user/reset-link/${user._id}/${resetString}`
    const link = `${frontHost}/#/reset-link/${accessToken}`
    const subject = 'Password Reset Link'
    const message = `<p>We received a request to reset your password. Click on the link below to proceed with resetting your password:</p>
        <a href="${link}">Click here</a>
        <p>This link will expire in 24 hours. If you did not request a password reset, you can safely ignore this email. If you have any questions or need further assistance, feel free to contact us.</p>
        <p>Best regards,<br>The Yuu Team</p>`

    await sendEmail(user.email, subject, message)

    // res.json({ user, message: "Password reset link has been sent to your email" })
    return res.status(200).json(new ApiResponse(200, { status: "reset" }, "Password reset link has been sent to your email"))
})

// Route: Update Reset password in db using POST "/auth/reset-password"
const resetPassword = asyncHandler(async (req, res) => {

    const { password, token } = req.body
    if (!token) {
        return res.status(400).send(new ApiError(400, "Unauthorized Access"))
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decodedToken._id).select("-password -refreshToken -verificationCode -isVerified")
    if (!user) {
        return res.status(400).send(new ApiError(400, "Invalid Access Token"))
    }

    const newPass = { password: password }
    await User.findByIdAndUpdate(user._id, newPass, { new: true })

    return res.status(200).send(new ApiResponse(200, { status: "reset" }, "User password is updated successfully"))
})

module.exports = { registerUser, loginUser, getUser, updatePassword, updateProfile, verifyEmail, forgotPassword, resetPassword }