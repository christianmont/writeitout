var express = require('express');
var router = express.Router();
const User = require('../models/User.js')
const Match = require('../models/Match.js')
const Challenge = require('../models/Challenge.js')

/* GET users listing. */
router.get('/:id', async(req, res) => {
  let profileUser = await User.findById(req.params.id)
  let waiting = await Challenge.find({"user": profileUser.id}).countDocuments();
  let matches = await Match.find( { $or: [ { "a": profileUser.id }, { "b": profileUser.id } ] } )
  const users = await User.find()
  let id_to_name = {}
  users.forEach(u => {
    id_to_name[u._id] = u.userName
  });
  res.render('layouts/main', {
    body: 'profile',
    title: 'WriteItOut',
    profileUser,
    matches,
    waiting,
    user: req.user,
    id_to_name
  });
});

module.exports = router;
