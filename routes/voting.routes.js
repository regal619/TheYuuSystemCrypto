const { Router } = require("express")
const verifyJwt = require("../middlewares/auth.middleware.js")
const { getStats, addActivity, updateActivity, deleteActivity, addCsvActivity, addMultipleActivities, getAllActivities } = require("../controllers/voting.controllers.js")
// const upload = require("../middlewares/multer.middleware.js")

const router = Router()
router.use(verifyJwt)

router.route("/getStats").get(getStats)
// router.route("/getAllActivities").get(getAllActivities)
// router.route("/addActivity").post(addActivity)
// router.route("/addCsvActivity").post(upload.single("file"),addCsvActivity)
// router.route("/addMultipleActivities").post(addMultipleActivities)
// router.route("/updateActivity").post(updateActivity)
// router.route("/deleteActivity/:id").post(deleteActivity)

module.exports = router     