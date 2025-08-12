const { default: mongoose } = require("mongoose");
const Participants = require("../models/participants.models.js");
const Team = require("../models/team.models.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { asyncHandler } = require("../utils/asyncHandler.js");
const { uploadOnCloudinary } = require("../utils/cloudinary.js");

const addParticipants = asyncHandler(async (req, res) => {
    // let jsonData = data;
    // let jsonData = req.body;
    if (!jsonData)
        return res.json(new ApiError(404, "Data not found!"))

    const user_id = req.user.isAdmin ? req.user._id : req.user.user_id
    const sub_admin_id = req.user.isAdmin ? null : req.user._id

    jsonData = jsonData.map((participant) => ({
        ...participant,
        user_id,
        sub_admin_id
    }));

    await Participants.insertMany(jsonData);

    return res.json(new ApiResponse(200, "Participants added successfully!"))
})

const updateParticipantPic = asyncHandler(async (req, res) => {

    const { _id, image } = req.body
    // const imageLocal = req?.file?.path
    // console.log("imageLocal", imageLocal, req?.file, req.body)
    console.log("imageLocal", req?.file, req.body)

    let participant = await Participants.findById(_id)
    if (!participant) {
        return res.status(404).send(new ApiError(404, "Participant doesn't found"))
    }

    // if (!imageLocal) {
    //     return res.status(400).send(new ApiError(400, "Image is required"))
    // }

    // const image = await uploadOnCloudinary(imageLocal)
    // console.log("image", image)

    if (!image) {
        return res.status(400).send(new ApiError(400, "Image URL is required"))
    }

    participant = await Participants.findByIdAndUpdate(
        participant._id,
        {
            image: image,
        },
        { new: true }
    )

    return res.json(new ApiResponse(200, participant, "Participant updated successfully!"))
})

const updateGradeGroup = asyncHandler(async (req, res) => {
    // const gradeMapping = {
    //     '9th': 'High School',
    //     '10th': 'High School',
    //     '11th': 'High School',
    //     '12th': 'High School',
    //     '7th': 'Grades 7-8',
    //     '8th': 'Grades 7-8',
    //     '5th': 'Grades 5-6',
    //     '6th': 'Grades 5-6',
    //     '3rd': 'Grades 3-4',
    //     '4th': 'Grades 3-4',
    //     '1st': 'Grades 1-2',
    //     '2nd': 'Grades 1-2',
    //     'KG': 'Grades (Pre-K)-KG',
    //     'Pre-K': 'Grades (Pre-K)-KG',
    //     'College / Graduate / شباب /أسرة': 'College / Graduate / شباب /أسرة'
    // };

    const gradeMapping = {
        'High School': 'High School',
        '7th&8th': 'Grades 7-8',
        '5th&6th': 'Grades 5-6',
        '3rd&4th': 'Grades 3-4',
        '1st': 'Grades 1-2',
        '2nd': 'Grades 1-2',
        'KG': 'Grades (Pre-K)-KG',
        'Pre-K': 'Grades (Pre-K)-KG',
        'College & Graduates': 'College & Graduates'
    };
    
    const participants = await Participants.find();

    for (const participant of participants) {
        const gradeGroup = gradeMapping[participant.grade];

        // Log if grade is not found in the mapping
        if (!gradeGroup) {
            console.log(`Unknown grade: ${participant.grade} for participant: ${participant._id} ${participant.firstName} ${participant.lastName}`);
        }

        await Participants.updateOne({ _id: participant._id }, { gradeGroup: gradeGroup || 'Unknown Group' });
    }

    return res.json(new ApiResponse(200, participants, "Participant Groups are updated successfully!"))
});


const getParticipants = asyncHandler(async (req, res) => {

    const church = req.user.church;
    const { activity, gradeGroup } = req.query;
    const activityObjectId = new mongoose.Types.ObjectId(activity)

    res.set('Cache-Control', 'no-store');  // No caching
    res.set('Pragma', 'no-cache');         // For HTTP 1.0 compatibility
    res.set('Expires', '0');   
    // const participants = await Participants.findById("6767c1beeed8f12f791f5062")
    // const participants = await Participants.find()
    // const participants = await Participants.findById("6767c1beeed8f12f791f5091")

    const participants = await Participants.aggregate([
        {
            $match: {
                church: church ? church : { $exists: true },
                // gradeGroup: gradeGroup ? gradeGroup : { $exists: true }
            }
        },
        {
            $lookup: {
                from: "teams",
                // localField: "_id",
                // foreignField: "participants",
                // as: "teamInfo"
                let: { participantId: '$_id' }, // Reference to the participant's _id
                pipeline: [
                    {
                        $match: {
                            // activity_id: activityObjectId
                            $expr: {
                                $or: [
                                    { $eq: [activityObjectId, undefined] }, // If activity_id is null, return all
                                    {
                                        $and: [
                                            { $eq: ['$activity_id', activityObjectId] }, // Match activity_id
                                            { $in: ['$$participantId', '$participants'] } // Check if participantId is in the team's participants array
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                ],
                as: 'teamsWithActivity' // Alias for matched teams
            }
        },
        // {
        //     $match: {
        //         $expr: {
        //             $not: {
        //                 $anyElementTrue: {
        //                     $map: {
        //                         input: '$teamsWithActivity',
        //                         as: 'team',
        //                         in: {
        //                             $in: ['$_id', '$$team.participants'] // Check if participant is in any team's participants
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // },
        {
            $match: {
                'teamsWithActivity': { $size: 0 }
            }
        },
        {
            $project: {
                teamsWithActivity: 0
            }
        }
    ])

    return res.json(new ApiResponse(200, participants, "Participants are fetched successfully!"))
})
// 6767c1beeed8f12f791f5071

const getParticipantScores = asyncHandler(async (req, res) => {

    // const church = req.user.church;
    const { activity, gradeGroup } = req.query;
    const activityObjectId = new mongoose.Types.ObjectId(activity)

    const participants = await Participants.aggregate([
        {
            $match: {}
        },
        {
            $lookup: {
                from: "teams",
                let: { participantId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $in: ["$$participantId", "$participants"]
                            }
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
                        $unwind: {
                            path: "$activity",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            name: 1,
                            status: 1,
                            activity: "$activity.name",
                        }
                    },
                ],
                as: "teams"
            }
        },
        {
            $addFields: {
                teams: {
                    $arrayToObject: {
                        $map: {
                            input: "$teams",
                            as: "team",
                            // in: ["$$team.activity", "$$team.status"],
                            in: [
                                "$$team.activity",
                                {
                                    $cond: {
                                        if: { $eq: ["$$team.status", "winner"] },
                                        then: 1,
                                        else: 0
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $replaceRoot: { newRoot: { $mergeObjects: ["$teams", "$$ROOT"] } }
        },
        {
            $project: { teams: 0 }
        }
    ]);




    return res.json(new ApiResponse(200, participants, "Participants are fetched successfully!"))
})


module.exports = { addParticipants, getParticipants, updateGradeGroup, getParticipantScores, updateParticipantPic }