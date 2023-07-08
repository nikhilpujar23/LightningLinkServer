const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const keys = require('./keys');
const User = require('../models/user-model');
const jwt = require('jsonwebtoken');
const dotenv=require('dotenv');

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((id, done) => {
  User.findById(id).then((user) => {
    done(null, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      // options for google strategy
      scope: ['profile', 'email'],
      clientID: keys.google.clientID,
      clientSecret: keys.google.clientSecret,
    
      // callbackURL:'http://localhost:5002/api/googleAuth/redirect'
      callbackURL: 'https://lightning-link-server.onrender.com/api/googleAuth/redirect'
      // callbackURL:`${process.env.SERVER}/api/googleAuth/redirect`
    },
    (accessToken, refreshToken, profile, done) => {
      // check if user already exists in our own db
      User.findOne({ googleId: profile.id }).then((currentUser) => {
        if (currentUser) {
          // already have this user
          console.log('user is: ', currentUser);
          const token = jwt.sign({ user: currentUser }, keys.session.secretWord);
          done(null, { user: currentUser, token }); // передаем и user, и token
        } else {
          // if not, create user in our db
          new User({
            googleId: profile.id,
            username: profile.displayName
          })
            .save()
            .then((newUser) => {
              console.log('created new user: ', newUser);
              const token = jwt.sign({ userId: newUser._id }, keys.session.secretWord);
              done(null, { user: newUser, token });
            });
        }
      });
    }
  )
);
