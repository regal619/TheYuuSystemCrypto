const { Router } = require("express")
const verifyJwt = require("../middlewares/auth.middleware.js")
const { getStats, addVote, getVotingData } = require("../controllers/voting.controllers.js")

const router = Router()
router.use(verifyJwt)

router.route("/getStats").get(getStats)
router.route("/addVote").post(addVote)
router.route("/getVotingData").get(getVotingData)

module.exports = router