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

console.log(process.env.API_KEY);

// mongoose
const mongoose = require ("mongoose");
// connection
mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});
// validate 
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
   console.log("Successfully connected to secretsDB");
});

// create Schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// encryption
const encrypt = require("mongoose-encryption");
userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

//create model
const User = new mongoose.model("User", userSchema);

app.get("/", function(req, res){
    res.render("home");
});
app.get("/login", function(req, res){
    res.render("login");
});
app.post("/login", function(req, res){
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({email: username}, function(err,foundUsername){
        if(err){
            console.log(err);
        } else {
            if(foundUsername){
                if(foundUsername.password === password){
                    res.render("secrets");
                }
            }
        }
    });
});
app.get("/register", function(req, res){
    res.render("register");
});
app.post("/register", function(req, res){

    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    })
    newUser.save(function(err){
        res.render(err || "secrets");
    })
});


//Set up an app.listen to allow the browser to listen for port 3000
app.listen(3000, function () {
    console.log("Server started at port: 3000!");
})