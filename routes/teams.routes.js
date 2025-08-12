const { Router } = require("express")
const verifyJwt = require("../middlewares/auth.middleware.js")
const { addTeam, getTeams, updateTeam, updateTeamStatus, deleteTeam } = require("../controllers/team.controllers.js")

const router = Router()
router.use(verifyJwt)

router.route("/addTeam").post(addTeam)
router.route("/getTeams").get(getTeams)
router.route("/updateTeam").post(updateTeam)
router.route("/deleteTeam/:id").post(deleteTeam)
router.route("/updateTeamStatus/:id").get(updateTeamStatus)

module.exports = router