const { Router } = require("express")
const verifyJwt = require("../middlewares/auth.middleware.js")
const { getCoordinators, addCoordinator, updateCoordinator, deleteCoordinator, getActivityCoordinators } = require("../controllers/coordinator.controllers.js")

const router = Router()
router.use(verifyJwt)

router.route("/getCoordinators").get(getCoordinators)
router.route("/getActivityCoordinators").get(getActivityCoordinators)
router.route("/addCoordinator").post(addCoordinator)
router.route("/updateCoordinator").post(updateCoordinator)
router.route("/deleteCoordinator/:id").post(deleteCoordinator)

module.exports = router