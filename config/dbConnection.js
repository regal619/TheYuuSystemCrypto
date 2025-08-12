const mongoose = require("mongoose");
const { DATABASE_NAME } = require("../constants.js");

const connectDb = async () => {
    try {
        console.log("Connecting to database...",DATABASE_NAME);
        
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DATABASE_NAME}`)
        console.log("Database connected, db host: ", connectionInstance.connection.host);
    } catch (error) {
        console.log("Database connection failed ", error);
        process.exit(1);
    }
}


module.exports = connectDb