const express = require('express')
const passport = require('passport')
const User = require('../models/User')
const router = express.Router()

// @desc     Auth with Google
// @route    GET /auth/google
router.get('/google', passport.authenticate('google', {
    scope: ['profile']
}))

// @desc     Google auth callback
// @route    GET /auth/google/callback
router.get('/google/callback', passport.authenticate('google', {
    failureRedirect: '/login'
}), async (req, res) => {
    console.log("userid is"+req.user.userID)
    let user = await User.findOne({"site":"google","userID":req.user.userID})
    req.user = user
    if(req.user.userName) {
        res.redirect('/')
    } else {
        res.redirect(`/finish-signin`)
    }
})


// @desc     Auth with Twitter
// @route    GET /auth/twitter
router.get('/twitter', passport.authenticate('twitter'))

// @desc     Twitter auth callback
// @route    GET /auth/twitter/callback
router.get('/twitter/callback', passport.authenticate('twitter', {
    failureRedirect: '/login'
}), (req, res) => {
    res.redirect('/')
})

// @desc     Auth with Facebook
// @route    GET /auth/facebook
router.get('/facebook', passport.authenticate('facebook'))

// @desc     Facebook auth callback
// @route    GET /auth/facebook/callback
router.get('/facebook/callback', passport.authenticate('facebook', {
    failureRedirect: '/login'
}), (req, res) => {
    res.redirect('/')
})

// @desc     Auth locally
// @route    GET /auth/local
router.post('/local',
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login' }
    )
)

// @desc    Logout user
// @route   /auth/logout
router.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
})

module.exports = router