const { Router } = require("express")
const verifyJwt = require("../middlewares/auth.middleware.js")
const { getResults } = require("../controllers/result.controllers.js")

const router = Router()
router.use(verifyJwt)

router.route("/getResults").get(getResults)

module.exports = router