const { Router } = require("express")
const verifyJwt = require("../middlewares/auth.middleware.js")
const { donateIpn } = require("../controllers/donateIpn.controllers.js")

const router = Router()
// router.use(verifyJwt)

router.route("/donate/ipn").post(donateIpn)

module.exports = router