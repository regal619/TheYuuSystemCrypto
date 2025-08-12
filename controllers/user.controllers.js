const User = require("../models/user.models.js");
const { asyncHandler } = require("../utils/asyncHandler.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { login, register } = require("../validations/user.validations.js");

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

    const { email } = req.body
    const { error, value } = register.body.validate(req.body);

    if (error) {
        return res.status(400).send(new ApiError(400, error.details[0].message))
    }

    const isUserExist = await User.findOne({ email });

    if (isUserExist) {
        return res.status(409).send(new ApiError(409, "This user already exists"))
    }

    const user = await User.create({
        ...req.body,
        coordinators: 1,
        activity: 1,
        isAdmin: true
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        return res.status(500).send(new ApiError(500, "Something went wrong while registering user"))
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    return res.status(200).json(new ApiResponse(200, { accessToken }, "User is registered successfully"))
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    const { error } = login.body.validate(req.body);

    if (error) {
        return res.status(400).send(new ApiError(400, error.details[0].message))
    }

    const user = await User.findOne({ email })

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

    return res.status(200).json(new ApiResponse(200, { accessToken }, "User logged in successfully"))
})

const getUser = asyncHandler(async (req, res) => {
    return res.status(200).send(new ApiResponse(200, req.user, "User fetched successfully"))
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

module.exports = { registerUser, loginUser, getUser, updatePassword }