const { default: mongoose } = require("mongoose");
const Team = require("../models/team.models.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { asyncHandler } = require("../utils/asyncHandler.js");
const Activity = require("../models/activity.models.js");
const Participants = require("../models/participants.models.js");


const addTeam = asyncHandler(async (req, res) => {

    const user_id = req.user.isAdmin ? req.user._id : req.user.user_id
    const sub_admin_id = req.user.isAdmin ? null : req.user._id

    await Team.create({
        ...req.body,
        user_id,
        sub_admin_id
    });

    return res.json(new ApiResponse(200, "Team added successfully!"))
})

const updateTeam = asyncHandler(async (req, res) => {

    const _id = req.body._id
    const user_id = req.user.isAdmin ? req.user._id : req.user.user_id
    const sub_admin_id = req.user.isAdmin ? null : req.user._id

    let team = await Team.findById(_id);

    if (!team) {
        return res.status(404).send(new ApiError(404, "Team doesn't found!"))
    }

    team = await Team.updateOne(
        { _id },
        {
            $set: {
                ...req.body,
                user_id,
                sub_admin_id
            },
        }
    );

    return res.json(new ApiResponse(200, team, "Team updated successfully!"))
})

const updateTeamStatus = asyncHandler(async (req, res) => {

    const _id = req.params.id

    let team = await Team.findByIdAndUpdate(_id, { status: "winner", }, { new: true });

    if (!team) {
        return res.status(404).send(new ApiError(404, "Team doesn't found!"))
    }

    let teams = await Team.find({ activity_id: team.activity_id });

    teams.forEach(async (team) => {

        if (!team._id.equals(new mongoose.Types.ObjectId(_id))) {

            await Team.updateOne(
                { _id: team._id },
                {
                    $set: {
                        status: "loser"
                    },
                }
            );
        }

    })

    return res.json(new ApiResponse(200, { teams: !team._id.equals(new mongoose.Types.ObjectId(_id)) }, "Team updated successfully!"))
})

const deleteTeam = asyncHandler(async (req, res) => {
    const _id = req.params.id;

    const team = await Team.findByIdAndDelete(_id);

    if (!team) {
        return res.status(404).send(new ApiError(404, "Team doesn't found!"));
    }

    return res.json(new ApiResponse(200, null, "Team deleted successfully!"));
});

const getTeams = asyncHandler(async (req, res) => {

    const church = req.user.church
    let activity_ids = req.user.activity_ids;
    const isActivityCoordinator = req.user.isActivityCoordinator;
    let activities;
    let teams, participant;

    if (isActivityCoordinator) {
        if (isActivityCoordinator && activity_ids && Array.isArray(activity_ids) && activity_ids.length > 0) {
            activity_ids = activity_ids.map(id => new mongoose.Types.ObjectId(id));
            activities = await Activity.find({ _id: { $in: activity_ids }, status: 1 });
            // teams = await Team.find({ activity_id: { $in: activity_ids } })
            // teams = await Team.aggregate([
            //     { $match: { activity_id: { $in: activity_ids } } },
            //     {
            //         $addFields: {
            //             participants: {
            //                 $map: {
            //                     input: "$participants",
            //                     as: "p",
            //                     in: { $toObjectId: "$$p" }
            //                 }
            //             }
            //         }
            //     },
            //     {
            //         $lookup: {
            //             from: "participants",
            //             localField: "participants",
            //             foreignField: "_id",
            //             as: "participantsData"
            //         }
            //     },
            // ])
            // participant = await Participants.find({ _id: new mongoose.Types.ObjectId("6767c1beeed8f12f791f573f") })
            teams = await Team.aggregate([
                { $match: { activity_id: { $in: activity_ids } } },
                {
                    $lookup: {
                        from: "activities",
                        localField: "activity_id",
                        foreignField: "_id",
                        as: "activity"
                    }
                },
                {
                    $addFields: {
                        activity: {
                            $first: '$activity'
                        }
                    }
                },
                {
                    $lookup: {
                        from: "participants",
                        localField: "participants",
                        foreignField: "_id",
                        as: "participants"
                    }
                },
                {
                    $addFields: {
                        gradeGroup: {
                            $ifNull: [{ $first: "$participants.gradeGroup" }, null]
                        }
                    }
                }
            ])
        } else if (isActivityCoordinator && activity_ids.length < 1) {
            teams = []
        }
        return res.json(new ApiResponse(200, teams, "Teams fetched successfully!"))
    }

    // const teams = church ?
    //     await Team.find({ church }) :
    //     await Team.find({});

    teams = await Team.aggregate([
        {
            $match: {
                church: church ? church : { $exists: true }
            }
        },
        {
            $lookup: {
                from: "activities",
                localField: "activity_id",
                foreignField: "_id",
                as: "activity"
            }
        },
        {
            $addFields: {
                activity: {
                    $first: '$activity'
                }
            }
        },
        {
            $lookup: {
                from: "participants",
                localField: "participants",
                foreignField: "_id",
                as: "participants"
            }
        },
        {
            $addFields: {
                gradeGroup: {
                    $ifNull: [{ $first: "$participants.gradeGroup" }, null]
                }
            }
        }
    ])

    return res.json(new ApiResponse(200, teams, "Team fetched successfully!"))
})

module.exports = { addTeam, getTeams, updateTeam, updateTeamStatus, deleteTeam }