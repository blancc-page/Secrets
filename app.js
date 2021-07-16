require("dotenv").config();
// express
const express = require ("express");
const app = express();

// bodyparser
const bodyParser = require ("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

// ejs
const ejs = require ("ejs");
app.set("view engine", "ejs");
app.use(express.static("public"));

//session
const session = require('express-session');
const passport = require("passport");
passportLocalMongoose = require("passport-local-mongoose");

//findorcreate
const findOrCreate = require("mongoose-findorcreate");

// googleOAuth
var GoogleStrategy = require('passport-google-oauth20').Strategy;

app.use(session({
    secret: "Thisisasecret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


// mongoose
const mongoose = require ("mongoose");
// connection
mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});
// validate 
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
   console.log("Successfully connected to secretsDB");
});

// create Schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//create model
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
    });
    }
));


app.get("/", function(req, res){
    res.render("home");
});
app.get("/auth/google", 
passport.authenticate("google", {scope: ["profile"]})); 

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });
app.get("/login", function(req, res){
    res.render("login");
});

app.post("/login", function(req, res){
    const user = new User({
        username: req.body.username,
        passwrod: req.body.password
    });
    req.login(user, function(err){
        if(err){
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
            res.redirect("/secrets");
            });
        }
    });
});
app.get("/register", function(req, res){
    res.render("register");
});
app.get("/secrets", function(req,res){
    User.find({"secret": {$ne: null}}, function(err, foundUsers){
        if(err){
            console.log(err);
        } else {
            res.render("secrets", {usersWithSecrets: foundUsers});
        }
    });
});
app.get("/submit", function (req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    } else{
        res.redirect("/login");
    }
});
app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;
    User.findById(req.user.id, function(err, foundUser){
        if(err){
            console.log(err);
        } else {
            if(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                });
            }
        }
    });
    });
app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});
app.post("/register", function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err,user){
    if(err){
        console.log(err);
        res.redirect("/register");
    } else {
        passport.authenticate("local")(req, res, function () {
            res.redirect("/secrets");
        })
    }
    });
});


//Set up an app.listen to allow the browser to listen for port 3000
app.listen(3000, function () {
    console.log("Server started at port: 3000!");
})