const { Router } = require("express")
const verifyJwt = require("../middlewares/auth.middleware.js")
const { getCoordinators, addCoordinator, updateCoordinator, deleteCoordinator, getActivityCoordinators, createTransaction, successTransaction, cancelTransaction, donateIpn } = require("../controllers/transactions.controllers.js")

const router = Router()

router.use(verifyJwt)

router.route("/create").post(createTransaction)
router.route("/success").post(successTransaction)
router.route("/cancel").post(cancelTransaction)
router.route("/donate/ipn").post(donateIpn)

// router.route("/getCoordinators").get(getCoordinators)
// router.route("/getActivityCoordinators").get(getActivityCoordinators)
// router.route("/addCoordinator").post(addCoordinator)
// router.route("/updateCoordinator").post(updateCoordinator)
// router.route("/deleteCoordinator/:id").post(deleteCoordinator)

module.exports = router