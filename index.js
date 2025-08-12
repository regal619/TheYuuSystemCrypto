const { app } = require("./app");
const connectDb = require("./config/dbConnection");

const PORT = process.env.PORT || 2802

connectDb()
    .then(() => {
        app.listen(PORT, () => {
            console.log("App is listening on PORT ", PORT);
        })
    })
    .catch((err) => {
        console.log("Db connection failed", err);
    })