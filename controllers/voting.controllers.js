const Comission = require("../models/comission.models")
const Top100Members = require("../models/top100Members.models")
const Transactions = require("../models/transactions.models")
const User = require("../models/user.models")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const { asyncHandler } = require("../utils/asyncHandler")

const getVotingData = asyncHandler(async (req, res) => {

    const votingData = await Top100Members.find({})

    return res.json(new ApiResponse(200, votingData, "Voting Data fetched successfully"))
})

const getComission = asyncHandler(async (req, res) => {

    const comission = await Comission.aggregate([
        { $match: {} },
        {
            $unwind: {
                path: "$comission_members",
                preserveNullAndEmptyArrays: false
            }
        },
        {
            $match: {
                "comission_members": { $ne: null }
            }
        },
        {
            $lookup: {
                from: "top100members", // Ensure this matches the actual collection name in MongoDB (check for case sensitivity)
                localField: "comission_members",
                foreignField: "user_id",
                as: "member_info"
            }
        },
        {
            $unwind: "$member_info"
        },
        {
            $group: {
                _id: "$_id",
                casting_last_day: { $first: "$casting_last_day" },
                president_members: { $first: "$president_members" },
                comission_members: {
                    $push: {
                        user_id: "$comission_members.user_id",
                        member_status: "$comission_members.member_status",
                        member_info: "$member_info"
                    }
                }
            }
        },
        {
            $lookup: {
                from: "users", // Ensure this matches the actual collection name in MongoDB (check for case sensitivity)
                localField: "president_members",
                foreignField: "_id",
                as: "president_member"
            }
        },
        {
            $project: {
                "president_member.password": 0,
                "president_member.refreshToken": 0,
                "president_member.verificationCode": 0
            }
        }
        // {
        //     $unwind: "$members"
        // },
        // {
        //     $project: {
        //         _id: 0,
        //         casting_last_day: 1,
        //         comission_members: "$members",
        //         president_members: 1
        //     }
        // },
        // { $sort: { "comission_members.investment": -1 } }
        // { $match: {} },
        // {
        //     $lookup: {
        //         from: "top100members",
        //         localField: "user_id",
        //         foreignField: "user_id",
        //         as: "member"
        //     },
        // },
        // {
        //     $unwind: "$member"
        // },
        // {
        //     $project: {
        //         _id: 0,
        //         user_id: "$user_id",
        //         full_name: "$member_info.full_name",
        //         investment: "$member_info.investment",
        //         votes: "$member_info.votes",
        //         vote_status: "$member_info.vote_status",
        //         casting_last_day: 1,
        //         member_status: 1
        //     }
        // },
        // { $sort: { investment: -1 } }
    ]);

    // console.log("Comission Data:", comission[0].comission_members);


    return res.json(new ApiResponse(200, comission, "Comission Data fetched successfully"))
})

const addVote = asyncHandler(async (req, res) => {
    const { user_id } = req.body

    const userDoc = await Top100Members.findOne({ user_id });
    if (!userDoc) {
        return res.status(404).send(new ApiError(404, "User not found"));
    }
    const updatedVotes = (userDoc.votes || 0) + 1;
    await Top100Members.updateOne(
        { user_id: user_id },
        { $set: { votes: updatedVotes } }
    );

    // Update the user's isVoted status
    await User.findByIdAndUpdate(req.user._id, { isVoted: true }, { new: true });

    return res.json(new ApiResponse(200, {}, "Vote is added successfully!"))
})

const getStats = asyncHandler(async (req, res) => {

    const totalMembers = await User.countDocuments({ status: 1 })
    const total_investments_result = await Transactions.aggregate([
        { $match: {} },
        { $group: { _id: null, total: { $sum: "$price_amount" } } }
    ]);
    const total_investments = total_investments_result.length > 0 ? total_investments_result[0].total : 0;

    if (totalMembers >= 100 && total_investments >= 100000) {
        const topTransactions = await Transactions.aggregate([
            {
                $group: {
                    _id: "$user_id",
                    total_amount: { $sum: "$price_amount" },
                    total_transactions: { $sum: 1 },
                    transactions: { $push: "$$ROOT" }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: "$user"
            },
            {
                $project: {
                    _id: 0,
                    user_id: "$_id",
                    full_name: "$user.full_name",
                    total_amount: 1,
                    total_transactions: 1,
                    // transactions: 1
                }
            },
            {
                $sort: { total_amount: -1 }
            },
            { $limit: 100 }
        ]);

        await Top100Members.insertMany(topTransactions.map(member => ({
            // ...member,
            full_name: member.full_name,
            investment: member.total_amount,
            user_id: member.user_id,
        })));

        // await Comission.
        // return res.status(400).send(new ApiError(400, "Total members should be at least 100 to add top members"))
        return res.json(new ApiResponse(200, { totalMembers, total_investments, top100Investers: topTransactions }, "Stats fetched successfully"))
    }

    return res.json(new ApiResponse(200, { totalMembers, total_investments }, "Stats fetched successfully"))
})

module.exports = { addVote, getStats, getVotingData, getComission }