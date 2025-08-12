const { Router } = require("express")
const { getUser, loginUser, registerUser, updatePassword } = require("../controllers/user.controllers.js")
const verifyJwt = require("../middlewares/auth.middleware.js")

const router = Router()

router.route("/signUp").post(registerUser)
router.route("/login").post(loginUser)
router.route("/getUser").get(verifyJwt, getUser)
router.route("/updatePassword").post(verifyJwt, updatePassword)

module.exports = router