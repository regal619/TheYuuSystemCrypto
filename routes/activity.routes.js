const { Router } = require("express")
const verifyJwt = require("../middlewares/auth.middleware.js")
const { getActivities, addActivity, updateActivity, deleteActivity, addCsvActivity, addMultipleActivities, getAllActivities } = require("../controllers/activity.controllers.js")
const upload = require("../middlewares/multer.middleware.js")

const router = Router()
router.use(verifyJwt)

router.route("/getActivities").get(getActivities)
router.route("/getAllActivities").get(getAllActivities)
router.route("/addActivity").post(addActivity)
router.route("/addCsvActivity").post(upload.single("file"),addCsvActivity)
router.route("/addMultipleActivities").post(addMultipleActivities)
router.route("/updateActivity").post(updateActivity)
router.route("/deleteActivity/:id").post(deleteActivity)

module.exports = router     