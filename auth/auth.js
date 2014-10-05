var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    bcrypt = require('bcrypt'),
    flash = require('connect-flash');
var User = require('../models/db.js').User;

module.exports = {
  /* Build passport object */
  configure: function(app) {
    app.use(flash());

    /* Local auth strategy */
    passport.use(new LocalStrategy(
      function(username, password, done) {
        User.findOne({ username: username }, function (err, user) {
          if (err) {
            return done(err);
          }
          if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
          }
          bcrypt.compare(password, user.password, function(err, res) {
            if (err) {
              return done(err);
            }
            if (!res) {
              return done(null, false, { 'message': 'Incorrect password.' });
            }
            return done(null, user);
          });
        });
      }
    ));

    /* Serialization handlers */
    passport.serializeUser(function(user, done) {
      done(null, user._id);
    });
    passport.deserializeUser(function(id, done) {
      User.findById(id, function(err, user) {
        done(err, user);
      });
    });

    app.use(passport.initialize())
       .use(passport.session());
    return passport;
  },

  /* Login route */
  login: function(req, res) {
    (passport.authenticate('local',
        { successRedirect: '/user',
          failureRedirect: '/',
        }))(req, res);
  },

  /* Logout route */
  logout: function(req, res) {
    req.logout();
    res.redirect('/');
  },

  /* Signup route */
  signup: function(req, res) {
    User.findOne({ username: req.body.username }, function(err, user) {
      if (err) {
        done(err);
      }
      if (user) {
        res.redirect('/');
      }
      else {
        bcrypt.genSalt(10, function(err, salt) {
          if (err) {
            console.error.bind(console, "Bcrypt error: ");
          }
          else {
            bcrypt.hash(req.body.password, salt, function(err, hash) {
              if (err) {
                console.error.bind(console, "Bcrypt error: ");
              }
              else {
                var user = new User({ username: req.body.username, 
                                      password: hash,
                                      firstname: req.body.firstname,
                                      lastname: req.body.lastname,
                                      device: req.body.device,
                                      jawbone: false,
                                      fitbit: false
                });
                user.save(function(err) {
                  if (err) {
                    console.error.bind(console, 'Mongoose save error: ');
                    res.send(500);
                  }
                  else {
                    // I think this will automatically sign in the user after creation
                    (passport.authenticate('local',
                      { successRedirect: '/user',
                        failureRedirect: '/',
                        failureFlash: true }))(req, res);
                  }
                });
              }
            });
          }
        });
      }
    });
  }
}
