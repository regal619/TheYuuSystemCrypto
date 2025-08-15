const { Router } = require("express")
const verifyJwt = require("../middlewares/auth.middleware.js")
const { createTransaction, successTransaction, cancelTransaction, donateIpn, getTransactions } = require("../controllers/transactions.controllers.js")

const router = Router()
router.use(verifyJwt)

router.route("/getTransactions").get(getTransactions)
router.route("/create").post(createTransaction)
router.route("/success").post(successTransaction)
router.route("/cancel").post(cancelTransaction)
router.route("/donate/ipn").post(donateIpn)

module.exports = router