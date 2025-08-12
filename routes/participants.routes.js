const { Router } = require("express")
const verifyJwt = require("../middlewares/auth.middleware.js")
const { addParticipants, getParticipants, updateGradeGroup, getParticipantScores, updateParticipantPic } = require("../controllers/participants.controllers.js")
const upload = require("../middlewares/multer.middleware.js")
// const { getParticipants, addParticipant, updateParticipant, deleteParticipant } = require("../controllers/participants.controllers.js")
// const { getParticipants } = require("../controllers/participants.controllers.js")


const router = Router()
router.use(verifyJwt)

router.route("/getParticipants").get(getParticipants)
router.route("/getParticipantScores").get(getParticipantScores)
router.route("/addParticipants").post(addParticipants)
router.route("/updateParticipantPic").post(updateParticipantPic)
// router.route("/updateParticipantPic").post(upload.single("image"), updateParticipantPic)
router.route("/updateGradeGroup").get(updateGradeGroup)

module.exports = router