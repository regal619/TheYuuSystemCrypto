const { Router } = require("express")
const verifyJwt = require("../middlewares/auth.middleware.js")
const { getDashboard } = require("../controllers/dashboard.controllers.js")

const router = Router()
router.use(verifyJwt)

router.route("/getStats").get(getDashboard)

module.exports = router     