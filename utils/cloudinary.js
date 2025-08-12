const cloudinary = require("cloudinary")
const fs = require("fs")
// import { v2 as cloudinary } from 'cloudinary';
// import fs from "fs"
// import dotenv from "dotenv"

// dotenv.config()

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_APIKEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilepath) => {
    try {
        console.log("localFilepath", localFilepath)
        const response = await cloudinary.v2.uploader.upload(localFilepath, {
            resource_type: "auto",
            folder: "rejoice_images"
        });

        fs.unlinkSync(localFilepath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilepath)
        return null;
    }
}

module.exports = { uploadOnCloudinary }
