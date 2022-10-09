//jshint esversion:6
require('dotenv').config()

const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

console.log(process.env.API_KEY);
const app = express();

app.set('view engine','ejs');
app.use(bodyparser.urlencoded({
    extended: true
  }));
  
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
});

const userschema = new mongoose.Schema({
    email :String,
    password :String
})

userschema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});


const User = new mongoose.model("User",userschema);


app.get("/",function(req,res){
    res.render("home");
})

app.get("/register",function(req,res){   
    res.render("register");
})



app.get("/login",function(req,res){
    res.render("login");
})

app.post("/register",function(req,res){
    const newuser = new User({
        email:req.body.username,
        password:req.body.password
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
})

app.post("/login",function(req,res){
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email:username},function(err,founduser){
        if(err){console.log(err)}
        else if(founduser){
         if(founduser.password === password){
            res.render("secrets")
         }else{
            res.send("INvalid CRedentials")
        }
        }
    })
})

app.listen(3000,function(req,res){
    console.log("Server Started on Port 3000")
})