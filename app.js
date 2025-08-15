const express = require("express")
const app = express()
const dotenv = require('dotenv');
const cors = require("cors");

dotenv.config({ path: '.env' });

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))

// routesuserGet
app.use("/api/v1/auth", require("./routes/auth.routes.js"))
// app.use("/api/v1/dashboard", require("./routes/dashboard.routes.js"))
app.use("/api/v1/transactions", require("./routes/transactions.routes.js"))
// app.use("/api/v1/activity", require("./routes/activity.routes.js"))
// app.use("/api/v1/participants", require("./routes/participants.routes.js"))
// app.use("/api/v1/teams", require("./routes/teams.routes.js"))
// app.use("/api/v1/results", require("./routes/results.routes.js"))

app.get("/", (req, res) => {
    res.send("The Yuu Cypto Backend")
})

module.exports = { app }