const User = require("../models/user.models.js");
const { asyncHandler } = require("../utils/asyncHandler.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { login, register } = require("../validations/user.validations.js");

const getCoordinators = asyncHandler(async (req, res) => {
    const user_id = req.user.isAdmin ? req.user._id : req.user.user_id;

    // const coordinators = await User.find({ $and: [{ isAdmin: false }, { status:0}] })
    const coordinators = await User.find({
        $and: [
            { user_id },
            { isAdmin: false },
            {
                $or: [
                    { isActivityCoordinator: false },
                    { isActivityCoordinator: { $exists: false } }
                ]
            }
        ]
    }).select("-password -refreshToken")

    return res.status(200).send(new ApiResponse(200, coordinators, "Coordinators fetched successfully!"))
})

const getActivityCoordinators = asyncHandler(async (req, res) => {
    const user_id = req.user.isAdmin ? req.user._id : req.user.user_id;

    // const coordinators = await User.find({ $and: [{ isAdmin: false }, { status:0}] })
    const coordinators = await User.find({ $and: [{ user_id }, { isAdmin: false }, { isActivityCoordinator: true }] }).select("-password -refreshToken")

    return res.status(200).send(new ApiResponse(200, coordinators, "Coordinators fetched successfully!"))
})

const addCoordinator = asyncHandler(async (req, res) => {
    console.log(req.body);

    const { email } = req.body
    // const { error, value } = register.body.validate(req.body);
    // console.log("value: ", value);

    // if (error) {
    //     return res.status(400).send(new ApiError(400, error.details[0].message))
    // }

    const isCoordinatorExist = await User.findOne({ email });

    if (isCoordinatorExist) {
        return res.status(409).send(new ApiError(409, "This coordinator already exists"))
    }

    const coordinator = await User.create({
        ...req.body,
        isAdmin: false,
        user_id: req.user._id,
    })

    const createdCoordinator = await User.findById(coordinator._id).select("-password -refreshToken")

    if (!createdCoordinator) {
        return res.status(500).send(new ApiError(500, "Something went wrong while adding coordinator"))
    }

    return res.status(200).json(new ApiResponse(200, { createdCoordinator }, "User is registered successfully"))
})

const updateCoordinator = asyncHandler(async (req, res) => {

    const fields = ['email', 'full_name', 'password', 'church', 'activity_ids'];
    let data = {};

    fields.forEach(field => {
        if (req.body[field] && req.body[field] !== "") {
            data[field] = req.body[field];
        }
    });

    const coordinator = await User.findByIdAndUpdate(
        req.body._id,
        {
            ...data
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    if (!coordinator) {
        return res.status(404).send(new ApiError(404, "Coordinator not exists"))
    }

    return res.json(new ApiResponse(200, coordinator, "Coordinator updated successfully"))
})

const deleteCoordinator = asyncHandler(async (req, res) => {
    const id = req.params.id

    const user = await User.findById(id)

    if (!user) {
        return res.status(404).send(new ApiError(404, "User not found"))
    }

    // const status = user.status === 1 ? 0 : 1;
    // const deletedCoordinator = await User.findByIdAndUpdate(req.params.id, { status }, { new: true })

    const deletedCoordinator = await User.findByIdAndDelete(id);

    return res.send(new ApiResponse(200, deletedCoordinator, "Coordinator deleted successfully"))
})

module.exports = { getCoordinators, addCoordinator, updateCoordinator, deleteCoordinator, getActivityCoordinators }