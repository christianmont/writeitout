var express = require('express');
var router = express.Router();
const User = require('../models/User.js')
const Match = require('../models/Match.js')
const Challenge = require('../models/Challenge.js')
const Topic = require('../models/Topic.js')
const passport = require('passport')
const mongoose = require('mongoose')
const { ObjectId } = require('mongodb');
const identicon = require('identicon')
const fs = require('fs')
const { v4: uuid_v4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { match } = require('assert');

/* GET home page. */
router.get('/', async (req, res) => {
  if(req.user) {
    let user = await User.findOne({"_id":req.user._id})
    req.user = user
  }
  const matches = await Match.find({ $or: [{"status": "Voting"}, {"status": "Finished"}]})
  const users = await User.find()
  let id_to_name = {}
  users.forEach(u => {
    id_to_name[u._id] = u.userName
  });
  res.render('layouts/main', {
    body: 'index',
    title: 'WriteItOut',
    user: req.user,
    matches,
    id_to_name
  });
});

router.get('/add-prompt', async(req, res) => {
  res.render('layouts/main', {
    body: 'add-prompt',
    title: 'Add Prompt',
    user: req.user
  })
})

router.post('/add-prompt', async(req, res) => {
  let prompts = req.body.prompt.split(/\n/)
  for(let i = 0; i < prompts.length; i++) {
    let newTopic = {
      text: prompts[i]
    }
    await Topic.create(newTopic)
  }
})

router.get('/login', async(req, res) => {
  res.render('layouts/main', {
    body: 'login',
    title: 'Login',
    user: req.user,
    noUser: false,
    incorrectPword: false
  });
})

router.post('/login', function(req, res, next) {
  passport.authenticate('local', async(err, user, info) => {
      var noUser = true
      var incorrectPword = false
      if (err) { return next(err); }
      let thisUser = await User.findOne({
          site: 'main',
          userName: req.body.username
      })
      if(thisUser) {
          noUser = false
          if(!bcrypt.compareSync(req.body.password, thisUser.password)) {
              incorrectPword = true
          }
      }
      if (!user) {
          return res.render('layouts/main', {
              body: 'login',
              noUser: noUser,
              incorrectPword: incorrectPword,
              username: req.body.username,
              password: req.body.password
          })
      }
      req.logIn(user, function(err) {
          if (err) { return next(err); }
          return res.redirect('/');
      });
  })(req, res, next);
});

router.get('/sign-up', async(req, res) => {
  res.render('layouts/main', {
    body: 'sign-up',
    title: 'Sign up',
    user: req.user,
    nameTaken: false,
    emailTaken: false,
    shortPword: false
  });
})

router.post('/sign-up', async (req, res) => {
  try {
      var defImage = false;
      const hashedPassword = await bcrypt.hashSync(req.body.password, 10)
      let img = uuid_v4()
      await identicon.generate({ id: img, size: 150 }, (err, buffer) => {
        if (err) throw err

        // buffer is identicon in PNG format.
        fs.writeFileSync(`./public/images/${img}.png`, buffer)
      });
      const newUser = {
          site: 'main',
          userID: 0,
          userName: req.body.username,
          email: req.body.email,
          password: hashedPassword,
          image: `${img}.png`,
          defImage: true
      }

      try {
          if(req.body.username === "") {
              var noUsername = true;
          } else {
              var noUsername = false;
          }
          if(req.body.email === "") {
              var noEmail = true;
          } else {
              var noEmail = false;
          }
          let user = await User.findOne({
              site: 'main',
              userName: req.body.username
          })
          if(user) {
              var isUser = true;
          } else {
              var isUser = false;
          }
          if(req.body.password === "") {
              var noPassword = true;
          } else {
              var noPassword = false;
              if(req.body.password.length < 8) {
                  var isShort = true;
              } else {
                  var isShort = false;
              }
          }
          if(isUser || isShort || noUsername || noPassword) {
              res.render('layouts/login', {
                  body: 'sign-up',
                  shortPassword: isShort,
                  username: req.body.username,
                  email: req.body.email,
                  password: req.body.password
              })
          } else {
              user = await User.create(newUser)
              req.login(user, function(err) {
                  if (err) { return next(err); }
                  return res.redirect(`/`);
              })
          }
      } catch(err) {
          console.error(err)
          res.status(500).render('layouts/main', {
              body: 'error/500',
              user: req.user
          })
      }
  } catch(err) {
      console.error(err)
      res.status(500).render('layouts/main', {
          body: 'error/500',
          user: req.user
      })
  }
})

router.get('/finish-signin', async(req, res) => {
  res.render('layouts/main', {
    body: 'finish-signin',
    title: 'Sign up',
    user: req.user,
    nameTaken: false
  });
})

router.post('/finish-signin', async(req, res) => {
  // Asynchronous API
  let image = uuid_v4()
  await identicon.generate({ id: image, size: 150 }, (err, buffer) => {
    if (err) throw err

    // buffer is identicon in PNG format.
    fs.writeFileSync(`./public/images/${image}.png`, buffer)
  });
  await User.updateOne(
    {"_id":req.user._id},
    {$set:
    {"userName":req.body.username,
    "email":req.body.email,
    "image":`${image}.png`}})
  req.user.userName = req.body.username;
  req.user.email = req.body.email
  req.user.image = `${image}.png`
  res.redirect("/")
})

router.post('/challenge', async (req, res) => {
  let user = await User.findOne({"_id":req.user._id})
  if(user.credits > 0) {
    await User.updateOne(
      {"_id":user._id},
      { $inc: {"credits": -1}})
    const challenges = await Challenge.find()
    const e = 1500
    const r = 50
    let completed = false
    for (let i = 0; i < challenges.length; i++) {
      if(!completed) {
        let u = await User.findById(challenges[i].user);
        if(u.elo <= e+r && u.elo >= e-r && u._id.toString() != user._id.toString()) {
          let matchTopic = await Topic.findOne()
          console.log(matchTopic)
          let matchTopicText = matchTopic.text
          await Topic.deleteOne( {"_id": matchTopic._id} )
          let newMatch = {
            a: u._id,
            b: user._id,
            topic: matchTopicText
          }
          await Challenge.deleteOne( {"_id": new ObjectId(challenges[i].id)} )
          await Match.create(newMatch)
          console.log("new match is" +newMatch)
          completed = true
        }
      }
    }
    if(!completed) {
      let newChallenge = {
        user: req.user._id
      }
      await Challenge.create(newChallenge)
    }
  }
});

router.get('/leaderboard', async (req, res) => {
  let users = await User.find().sort({"elo":-1})
  res.render('layouts/main', {
    body: 'leaderboard',
    title: 'Leaderboard',
    user: req.user,
    users
  });
})

module.exports = router;
