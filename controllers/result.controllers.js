const Activity = require("../models/activity.models.js");
const Participants = require("../models/participants.models.js");
const Team = require("../models/team.models.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { asyncHandler } = require("../utils/asyncHandler.js");

const getResults = asyncHandler(async (req, res) => {
    // const church = req.user.church
    // const churchFilter = church ? { church } : {};

    const totalTeams = await Team.countDocuments();
    const totalActivities = await Activity.countDocuments();
    const totalParticipants = await Participants.countDocuments();
    const churches = await Participants.distinct('church')

    // let cs = []

    // churches.forEach(async (church) => {
    //     console.log(church);


    //     // const tChurches = await Team.aggregate([
    //     //     {
    //     //         $match: {
    //     //             church: church
    //     //         }
    //     //     },
    //     //     {
    //     //         $lookup: {
    //     //             from: "participants",
    //     //             localField: "participants",
    //     //             foreignField: "_id",
    //     //             as: "participantsDe"
    //     //         }
    //     //     },
    //     //     {
    //     //         $unwind: '$participants'
    //     //     },
    //     //     {
    //     //         $group: {
    //     //             _id: '$participants',
    //     //             totalParticipants: { $sum: 1 }
    //     //         }
    //     //     },
    //     // ])
    //     const teams = await Team.find({ church })
    //     let totalWinTeams = 0;

    //     teams.map(t => t.status === 'winner' ? totalWinTeams++ : null)

    //     console.log({ totalTeams: teams.length, church, totalWinTeams });
    //     const data = { totalTeams: teams.length, church, totalWinTeams }
    //     cs.push(data)
    // })

    const teams = await Team.aggregate([
        {
            $match: {
                status: 'winner'
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

    const tm = await Team.aggregate([
        // {
        //     $match: {
        //         church: church ? church : { $exists: true }
        //     }
        // },
        {
            $lookup: {
                from: "participants",
                localField: "participants",
                foreignField: "_id",
                as: "participantsDe"
            }
        },
        {
            $unwind: '$participants'
        },
        {
            $group: {
                _id: '$participants',
                totalParticipants: { $sum: 1 }
            }
        },
    ])

    const data = { totalTeams, totalActivities, totalParticipants, totalParticipated: tm.length, notParticipated: totalParticipants - tm.length, totalChurches: churches.length, teams }

    return res.json(new ApiResponse(200, data, "Result stats fetched successfully!"))
})

module.exports = { getResults }