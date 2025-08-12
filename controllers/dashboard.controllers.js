const Activity = require("../models/activity.models.js");
const Participants = require("../models/participants.models.js");
const Team = require("../models/team.models.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { asyncHandler } = require("../utils/asyncHandler.js");

const getDashboard1 = asyncHandler(async (req, res) => {
    // const church = req.user.church
    const { gender, gradeGroup, church } = req.query;
    // const churchFilter = church ? { church } : {};
    // const gradeGroupFilter = gradeGroup ? { gradeGroup } : {};
    // const genderFilter = gender ? { gender } : {};

    const filters = {};
    if (church) filters.church = church;
    if (gender) filters.gender = gender;
    if (gradeGroup) filters.gradeGroup = gradeGroup;


    const totalParticipants = await Participants.countDocuments(filters);

    const totalTeams = await Team.countDocuments(filters);
    const totalActivities = await Activity.countDocuments();

    const tm = await Team.aggregate([
        {
            $match: {
                // church: church ? church : { $exists: true },
                filters
            }
        },
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

    const data = { totalTeams, totalActivities, totalParticipants, totalParticipated: tm.length, notParticipated: totalParticipants - tm.length }

    return res.json(new ApiResponse(200, data, "Dashboard stats fetched successfully!"))
})

const getDashboardg = asyncHandler(async (req, res) => {
    const { gender, gradeGroup, church } = req.query;

    // Build filter object for Participants and Teams
    const participantFilters = {};
    const teamFilters = {};
    if (church) {
        participantFilters.church = church;
        teamFilters.church = church;
    }
    if (gender) {
        participantFilters.gender = gender;
    }
    if (gradeGroup) {
        participantFilters.gradeGroup = gradeGroup;
        teamFilters.generalGroup = gradeGroup; // Assuming generalGroup in Team corresponds to gradeGroup
    }

    // Fetch counts
    const totalTeams = await Team.countDocuments(teamFilters);
    const totalActivities = await Activity.countDocuments(); // No filters applied for activities
    const totalParticipants = await Participants.countDocuments(participantFilters);

    // Aggregate to find participants who are part of teams
    const participatedParticipants = await Team.aggregate([
        {
            $match: teamFilters // Apply team filters
        },
        {
            $lookup: {
                from: "participants",
                localField: "participants",
                foreignField: "_id",
                as: "participantsData"
            }
        },
        {
            $unwind: "$participantsData" // Unwind participants array
        },
        {
            $match: participantFilters // Apply participant filters after lookup
        },
        {
            $group: {
                _id: "$participantsData._id", // Group by participant ID to avoid duplicates
                totalParticipated: { $sum: 1 }
            }
        },
        {
            $count: "totalParticipated" // Count unique participants
        }
    ]);

    // Extract total participated count (handle case where no participants are found)
    const totalParticipated = participatedParticipants.length > 0 ? participatedParticipants[0].totalParticipated : 0;

    // Calculate not participated
    const notParticipated = totalParticipants - totalParticipated;

    // Prepare response data
    const data = {
        totalTeams,
        totalActivities,
        totalParticipants,
        totalParticipated,
        notParticipated
    };

    return res.json(new ApiResponse(200, data, "Dashboard stats fetched successfully!"));
});

const getDashboard3 = asyncHandler(async (req, res) => {
    const { gender, gradeGroup, church } = req.query;

    // Common filters
    const filters = {};
    if (church) filters.church = church;
    if (gender) filters.gender = gender;
    if (gradeGroup) filters.gradeGroup = gradeGroup;

    // Filters for Team (only church is directly in Team model)
    const teamFilters = {};
    if (church) teamFilters.church = church;

    // Filters for Participants (church, gender, gradeGroup)
    const participantFilters = { ...filters };

    // Filters for Activity (only gradeGroup)
    const activityFilters = {};
    if (gradeGroup) activityFilters.gradeGroup = gradeGroup;

    const totalTeams = await Team.countDocuments(teamFilters);
    const totalActivities = await Activity.countDocuments(activityFilters);
    const totalParticipants = await Participants.countDocuments(participantFilters);

    const tm = await Team.aggregate([
        {
            $match: teamFilters
        },
        {
            $lookup: {
                from: "participants",
                localField: "participants",
                foreignField: "_id",
                as: "participantsDe"
            }
        },
        { $unwind: "$participantsDe" },
        {
            $match: {
                ...(gender && { "participantsDe.gender": gender }),
                ...(gradeGroup && { "participantsDe.gradeGroup": gradeGroup }),
                ...(church && { "participantsDe.church": church })
            }
        },
        {
            $group: {
                _id: "$participantsDe._id",
                totalParticipants: { $sum: 1 }
            }
        }
    ]);

    const totalParticipated = tm.length;
    const notParticipated = totalParticipants - totalParticipated;

    const data = {
        totalTeams,
        totalActivities,
        totalParticipants,
        totalParticipated,
        notParticipated
    };

    return res.json(new ApiResponse(200, data, "Dashboard stats fetched successfully!"));
});

const getDashboard = asyncHandler(async (req, res) => {
    const { gender, gradeGroup, church } = req.query;

    // Step 1: Build filter object for Participants
    const participantFilters = {};
    if (church) participantFilters.church = church;
    if (gender) participantFilters.gender = gender;
    if (gradeGroup) participantFilters.gradeGroup = gradeGroup;

    // Step 2: Fetch filtered participants
    const filteredParticipants = await Participants.find(participantFilters).select('_id');
    const participantIds = filteredParticipants.map(p => p._id);

    // Step 3: Count total participants
    const totalParticipants = filteredParticipants.length;

    // Step 4: Find teams that include any of the filtered participants
    const teams = await Team.find({
        participants: { $in: participantIds }
    }).select('activity_id participants');

    // Step 5: Count total teams
    const totalTeams = teams.length;

    // Step 6: Extract unique activity IDs from teams
    const activityIds = [...new Set(teams.map(team => team.activity_id.toString()))];

    // Step 7: Count total activities (unique activities from teams)
    const totalActivities = activityIds.length;

    // Step 8: Count participants who are part of teams (participated)
    const participatedParticipants = await Team.aggregate([
        {
            $match: {
                participants: { $in: participantIds }
            }
        },
        {
            $unwind: "$participants"
        },
        {
            $match: {
                participants: { $in: participantIds }
            }
        },
        {
            $group: {
                _id: "$participants", // Group by participant ID to avoid duplicates
                totalParticipated: { $sum: 1 }
            }
        },
        {
            $count: "totalParticipated" // Count unique participants
        }
    ]);

    // Extract total participated count (handle case where no participants are found)
    const totalParticipated = participatedParticipants.length > 0 ? participatedParticipants[0].totalParticipated : 0;

    // Step 9: Calculate not participated
    const notParticipated = totalParticipants - totalParticipated;

    // Prepare response data
    const data = {
        totalTeams,
        totalActivities,
        totalParticipants,
        totalParticipated,
        notParticipated
    };

    return res.json(new ApiResponse(200, data, "Dashboard stats fetched successfully!"));
});


module.exports = { getDashboard }