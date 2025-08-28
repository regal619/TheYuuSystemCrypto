const jwt = require("jsonwebtoken")
const { ApiError } = require("../utils/ApiError.js")
const User = require("../models/user.models.js")
const { asyncHandler } = require("../utils/asyncHandler.js")

const verifyJwt = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            return res.status(400).send(new ApiError(400, "Unauthorized Access"))
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        console.log("decodedToken: ", decodedToken);

        const user = await User.findById(decodedToken._id).select("-password -refreshToken -verificationCode -isVerified")
        if (!user) {
            return res.status(400).send(new ApiError(400, "Invalid Access Token"))
        }

        // to check the index number of the user
        let indexNumber = null;
        if (user) {
            indexNumber = await User.countDocuments({ _id: { $lt: user._id } }) + 1;
        }

        // req.user = user
        req.user = { ...user.toObject(), userNumber: indexNumber }
        next()
    } catch (error) {
        res.status(500).send(new ApiError(500, error.message || "Invalid Access Token"))
    }
})

module.exports = verifyJwt