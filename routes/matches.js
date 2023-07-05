var express = require('express');
var router = express.Router();
const User = require('../models/User.js')
const Match = require('../models/Match.js')
const Vote = require('../models/Vote.js')

router.get('/:id', async (req, res) => {
    try {
        let match = await Match.findById(req.params.id)
        if(match.status=="Writing") {
            const currentDate = new Date();

            // Calculate the time difference between the current date and the inputted date
            const timeDifference = currentDate.getTime() - match.createdAt.getTime();

            // Calculate the number of days between the current date and the inputted date
            const daysDifference = Math.floor(timeDifference / (24 * 60 * 60 * 1000));
            // Check if the current date is 3 days or more after the inputted date
            console.log(minutesDifference)
            if (daysDifference >= 3) {
                if(match.aStory || match.bStory) {
                    await Match.updateOne({"_id":match._id}, {$set: {"status": "Voting"}})
                    await Match.findById(req.params.id)
                } else {
                    await Match.deleteOne({"_id":match._id})
                }
                match = await Match.findById(req.params.id)
            }
        }
        let votes = await Vote.find({"match":match._id.toString()}).sort({$natural:-1})
        let aVotes = 0
        let bVotes = 0
        votes.forEach((v) => {
            if(v.winner == "a") {
                aVotes++
            } else if(v.winner == "b") {
                bVotes++
            }
        })
        if(!match) {
            res.redirect("/")
        } else {
            let id_to_name = {}
            const users = await User.find()
            users.forEach(u => {
                id_to_name[u._id] = u.userName
            });
            res.render('layouts/main', {
                body: 'matches/show',
                title: match.topic,
                user: req.user,
                match,
                id_to_name,
                votes,
                aVotes,
                bVotes
            });
        }
    } catch(err) {
        console.error(err)
        res.status(500).render('layouts/main', {
            body: 'error/500',
            user: req.user
        })
    }
})

router.get('/write/:id', async (req, res) => {
    let match = await Match.findById(req.params.id)
    res.render('layouts/main', {
        body: 'matches/write',
        title: match.topic,
        user: req.user,
        match
    });
})

router.post('/write/:id', async (req, res) => {
    let match = await Match.findById(req.params.id)
    if(match) {
        if(match.a == req.user._id.toString()) {
            await Match.updateOne(
                {"_id": req.params.id},
                { $set: { "aStory": req.body.story }})
        } else if(match.b == req.user._id.toString()) {
            await Match.updateOne(
                {_id: req.params.id},
                { $set: { bStory: req.body.story }})
        }
        let newMatch = await Match.findById(req.params.id)
        if(newMatch.aStory && newMatch.bStory) {
            await Match.updateOne(
                {"_id": match.id},
                { $set: {"status":"Voting"}})
        }
    }
    res.redirect(`/matches/${match._id}`)
})

router.get('/vote/:id', async (req, res) => {
    let id_to_name = {}
    const users = await User.find()
    users.forEach(u => {
        id_to_name[u._id] = u.userName
    });
    let match = await Match.findById(req.params.id)
    let votes = await Vote.find({"match":match._id.toString()}).sort({$natural:-1})
    res.render('layouts/main', {
        body: 'matches/vote',
        title: match.topic,
        user: req.user,
        votes,
        id_to_name,
        match
    });
})

router.post('/vote/:id', async (req, res) => {
    let match = await Match.findById(req.params.id)
    await User.updateOne(
        {"_id":req.user._id},
        { $inc: {"credits": 1}})
    if(match) {
        let newVote = {
            user: req.user._id,
            match: match._id,
            RFD: req.body.RFD,
            winner: req.body.winner
        }
        await Vote.create(newVote)
        let votes = await Vote.find({"match":match._id.toString()}).sort({$natural:-1})
        if(votes.length >= 3) {
            await Match.updateOne(
                {"_id": match.id},
                { $set: {"status":"Finished"}})
            let userA = await User.findOne({"_id":match.a})
            let userB = await User.findOne({"_id":match.b})
            let aVotes = 0
            let bVotes = 0
            votes.forEach((v) => {
                if(v.winner == "a") {
                    aVotes++
                } else if(v.winner == "b") {
                    bVotes++
                }
            })
            console.log("userA is " + userA)
            console.log("userB is " + userB)
            let k = 32
            let r1 = 10 ** (userA.elo/400)
            console.log("r1 is: " + r1)
            let r2 = 10 ** (userB.elo/400)
            console.log("r2 is: " + r2)
            let e1 = 1.0*r1/(r1+r2)
            console.log("e1 is: " + e1)
            let e2 = 1.0*r2/(r1+r2)
            console.log("e2 is: " + e2)
            let s1 = 0.5
            if(aVotes > bVotes) {
                s1 = 1
            } else if(aVotes < bVotes) {
                s1 = 0
            }
            let s2 = 1 - s1
            console.log("s1 is: " + s1)
            console.log("s2 is: " + s2)
            let elo1 = Math.round(userA.elo + k * (s1-e1))
            let elo2 = Math.round(userB.elo - k * (s1-e1))
            console.log(`elo 1: ${elo1}`)
            console.log(`elo 2: ${elo1}`)
            await User.updateOne(
                {"_id": match.a},
                { $set: {"elo":elo1}})
            await User.updateOne(
                {"_id": match.b},
                { $set: {"elo":elo2}})
        }
    }
})

module.exports = router;