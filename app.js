//jshint esversion:6
require('dotenv').config()

const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require('bcrypt');
// const saltRounds = 10;
const session = require("express-session")
const passport = require("passport");
const passportlocalmongoose = require("passport-local-mongoose")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const FacebookStrategy = require("passport-facebook")

const app = express();

app.set('view engine','ejs');
app.use(bodyparser.urlencoded({
    extended: true
  }));
  
app.use(express.static("public"));

app.use(session({
    secret: "Arigato Dattebayo!",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
});
//mongoose.set("useCreateIndex",true);



const userschema = new mongoose.Schema({
    email :String,
    password :String,
    googleId:String,
    facebookId:String,
    secret:String
})

userschema.plugin(passportlocalmongoose);
userschema.plugin(findOrCreate);

// userschema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});


const User = new mongoose.model("User",userschema);

passport.use(User.createStrategy());

//  passport.serializeUser(User.serializeUser());
//  passport.deserializeUser(User.deserializeUser());


  passport.serializeUser(function(user,done){
      done(null,user.id);
  })
  passport.deserializeUser(function(id,done){
      User.findById(id,function(err,user){
          done(err,user);
      })
  })



passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",

  },
  function(accessToken, refreshToken, profile, cb) {   
     console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {

    console.log(profile)
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
    res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
  );

  app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets page.
    res.redirect('/secrets');
  });

  app.get('/auth/facebook',
  passport.authenticate('facebook')
  );

  app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to Secrets.
    res.redirect('/secrets');
  });


app.get("/register",function(req,res){   
    res.render("register");
})

app.get("/login",function(req,res){
    res.render("login");
})

app.get("/secrets",function(req,res){
  
    User.find({secret:{$ne:null}},function(err,users){
        if(err){
            console.log(err);
        }else{
            if(users){
                res.render("secrets",{userswithsecrets:users});
            }
        }
    });
});

app.get("/submit",function(req,res){
    
    if(req.isAuthenticated()){
        res.render("submit")
    }else{
        res.redirect("/login")
    }
});

app.post("/submit",function(req,res){
    const submittedsecret = req.body.secret;

    User.findById(req.user.id,function(err,founduser){
       if(err){
        console.log(err);
       }else{
        if(founduser){
            founduser.secret = submittedsecret;
            founduser.save(function(){
                res.redirect("/secrets");
            })
        }
       }
    });
});

app.get("/logout",function(req,res){
    req.logout(function(err){
        if(err){
            console.log(err)
        }else{
            res.redirect("/");
        }
    });
   
})

app.post('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });

app.post("/register",function(req,res){

  /*  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
      
    const newuser = new User({
        email:req.body.username,
        password:hash
    })
    newuser.save(
        function(err){
            if(err){
                console.log(err)
            }else{
                res.render("secrets")
            }
        }
    ) 
    }); */

    User.register({username :req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })

})

app.post("/login",function(req,res){
    /*
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email:username},function(err,founduser){
        if(err){console.log(err)}
        else if(founduser){
            bcrypt.compare(password,founduser.password  , function(err, result) {
                if(result==true){
                    res.render("secrets")
                }else{
                    res.send("INvalid CRedentials")
                }
            });
        }
    })*/
    const user = new User({
        username : req.body.username,
        password : req.body.password
    })
   

    req.login(user,function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
})

app.listen(3000,function(req,res){
    console.log("Server Started on Port 3000")
})