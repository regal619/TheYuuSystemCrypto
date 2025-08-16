const { Router } = require("express")
const { getUser, loginUser, registerUser, updatePassword, verifyEmail, forgotPassword, resetPassword } = require("../controllers/user.controllers.js")
const verifyJwt = require("../middlewares/auth.middleware.js")

const router = Router()

router.route("/signUp").post(registerUser)
router.route("/login").post(loginUser)
router.route("/verifyEmail").post(verifyEmail)
router.route("/getUser").get(verifyJwt, getUser)
router.route("/updatePassword").post(verifyJwt, updatePassword)
router.route("/forgot-password").post(forgotPassword)
router.route("/reset-password").post(resetPassword)

module.exports = router