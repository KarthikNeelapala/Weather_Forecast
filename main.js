const express= require("express");
const bp=require("body-parser");
const ejs= require("ejs");
const app= express();
const axios=require('axios');
app.use(bp.urlencoded({ extended: true }));
app.set("view engine",'ejs');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore} = require('firebase-admin/firestore');
var serviceAccount = require("./key.json");

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

app.get('/',(req,res)=>{
    res.render("login.ejs");
})
app.get("/login/register",(req,res)=>{
    res.render("register.ejs");
})
    app.post('/login/register',(req,res)=>{
        const name=req.body.firstname + req.body.lastname;
        const mail=req.body.email;
        const password=req.body.password;
        const data={
            "Name":name,
            "Email":mail,
            "Password":password.toString()
        }
        db.collection('wd401').add(data).then(()=>{
          res.render("thirdpage.ejs",{temp:null,city:null});
            })
    })
    app.post('/login',(req,res)=>{
        const email = req.body.lmail;
        const password = req.body.lpassword;
        const npassword=password.toString();
        db.collection('wd401')
        .where("Email","==",email)
        .where("Password","==",npassword)
        .get()
        .then((docs)=>{
          if(docs.size>0)
          {
            res.render("thirdpage.ejs",{temp:null,city:null});
          }
          else{
            res.send("Unsuccessful Login");
          }
        });
      });
      app.post('/login/thirdpage',(req,res)=>
      {
            const place = req.body.place;
            axios.get(`http://api.weatherapi.com/v1/forecast.json?key=325d06f62de14a37ae4102306232905&q=${place}&days=7`).then(response =>
              res.render('thirdpage.ejs', { city: place, temp: response.data.current.temp_c })).catch(err => console.log())
          });

app.listen(3000, function () {

    console.log('Example app listening on port 3000!')
    
    })