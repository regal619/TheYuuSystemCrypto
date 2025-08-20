const Transactions = require("../models/transactions.models")
const User = require("../models/user.models")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const { asyncHandler } = require("../utils/asyncHandler")
// const Activity = require("../models/activity.models")
// const csv = require('csv-parser')
const fs = require('fs')
const path = require('path')


const addActivity = asyncHandler(async (req, res) => {

    // const { error } = addCustSupValidation.body.validate(req.body)
    // if (error) {
    //     return res.status(400).send(new ApiError(400, error.details[0].message))
    // }

    const user_id = req.user.isAdmin ? req.user._id : req.user.user_id
    const sub_admin_id = req.user.isAdmin ? null : req.user._id

    let activity = await Activity.create({
        ...req.body,
        user_id,
        sub_admin_id
    })

    const createdActivity = await Activity.findById(activity._id)

    if (!createdActivity) {
        return res.status(500).send(new ApiError(500, "Something went wrong will creating activity"))
    }

    return res.json(new ApiResponse(200, createdActivity, "Activity added successfully"))
})

const addMultipleActivities = asyncHandler(async (req, res) => {
    // const { error } = addCustSupValidation.body.validate(req.body)
    // if (error) {
    //     return res.status(400).send(new ApiError(400, error.details[0].message))
    // }

    if (!Array.isArray(req.body) || req.body.length === 0) {
        return res.status(400).send(new ApiError(400, "Request body must be a non-empty array of activities"))
    }

    const user_id = req.user.isAdmin ? req.user._id : req.user.user_id
    const sub_admin_id = req.user.isAdmin ? null : req.user._id

    const activitiesToAdd = req.body.map(activity => ({
        ...activity,
        user_id,
        sub_admin_id
    }))

    try {
        const createdActivities = await Activity.insertMany(activitiesToAdd)
        return res.json(new ApiResponse(200, createdActivities, "Activities added successfully"))
    } catch (err) {
        return res.status(500).send(new ApiError(500, "Something went wrong while adding activities"))
    }
})


const addCsvActivity = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).send(new ApiError(400, "CSV file is required"))
    }

    const user_id = req.user.isAdmin ? req.user._id : req.user.user_id
    const sub_admin_id = req.user.isAdmin ? null : req.user._id

    const filePath = path.join(__dirname, '../tmp', req.file.filename)
    const activities = []

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            activities.push({
                ...row,
                user_id,
                sub_admin_id
            })
        })
        .on('end', async () => {
            try {
                const createdActivities = await Activity.insertMany(activities)
                fs.unlinkSync(filePath) // Delete the CSV after processing
                return res.json(new ApiResponse(200, createdActivities, "Activities added successfully"))
            } catch (err) {
                console.error(err)
                fs.unlinkSync(filePath) // Delete the CSV after processing
                return res.status(500).send(new ApiError(500, "Something went wrong while adding activities"))
            }
        })
        .on('error', (err) => {
            console.error(err)
            return res.status(500).send(new ApiError(500, "Failed to read CSV file"))
        })
})

const updateActivity = asyncHandler(async (req, res) => {
    const { _id, name, submission_date } = req.body

    // const { error } = updateCustSupValidation.body.validate(req.body)
    // if (error) {
    //     return res.status(400).send(new ApiError(400, error.details[0].message))
    // }

    let activity = await Activity.findById(_id)
    if (!activity) {
        return res.status(404).send(new ApiError(404, "Activity doesn't found"))
    }

    const user_id = req.user.isAdmin ? req.user._id : req.user.user_id
    const sub_admin_id = req.user.isAdmin ? null : req.user._id

    activity = await Activity.findByIdAndUpdate(
        activity._id,
        {
            ...req.body,
            user_id,
            sub_admin_id
        },
        { new: true }
    )

    return res.json(new ApiResponse(200, activity, "Activity updated successfully"))
})

const getAllActivities = asyncHandler(async (req, res) => {

    const activities = await Activity.find({ status: 1 })

    return res.json(new ApiResponse(200, activities, "Activities fetched successfully"))
})

const getStats = asyncHandler(async (req, res) => {

    const totalMembers = await User.countDocuments({ status: 1 })
    const total_investments_result = await Transactions.aggregate([
        { $match: {} },
        { $group: { _id: null, total: { $sum: "$price_amount" } } }
    ]);
    const total_investments = total_investments_result.length > 0 ? total_investments_result[0].total : 0;

    return res.json(new ApiResponse(200, { totalMembers, total_investments }, "Stats fetched successfully"))
})



const deleteActivity = asyncHandler(async (req, res) => {
    const activityId = req.params.id
    let activity = await Activity.findById(activityId)

    if (!activity) {
        return res.status(404).send(new ApiResponse(404, "Activity not found"))
    }

    const status = activity.status === 0 ? 1 : 0;

    activity = await Activity.findByIdAndUpdate(activity._id, { status }, { new: true })

    return res.json(new ApiResponse(200, activity, "Activity deleted successfully!"))
})

module.exports = { addActivity, updateActivity, getStats, deleteActivity, addCsvActivity, addMultipleActivities, getAllActivities }