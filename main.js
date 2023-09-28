const express= require("express");
const bp=require("body-parser");
const ejs= require("ejs");
const app= express();
const axios=require('axios');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const session = require("express-session");
let hpassword=null;
app.use(bp.urlencoded({ extended: true }));
app.set("view engine",'ejs');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore} = require('firebase-admin/firestore');
var serviceAccount = require("./key.json");
app.use(session({
  secret: 'your-secret-key',
  resave: true,
  saveUninitialized: true,
}));
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

app.get('/',(req,res)=>{
    res.render("login.ejs",{wrong:null});
})
app.get("/login/register",(req,res)=>{
    res.render("register.ejs",{msg:null});
})
app.post('/login/register', async (req, res) => {
  const name = req.body.firstname + req.body.lastname;
  const mail = req.body.email;
  req.session.email = mail;
  req.session.name1=name;
  const password = req.body.password.toString();
      const querySnapshot = await db.collection('wd401').where('Email', '==', mail).get();

      if (!querySnapshot.empty) {
          res.render("register.ejs", { msg: "Already registered Email!!!" });
      } else {
          const hpassword = await bcrypt.hash(password, saltRounds);

          const data = {
              "Name": name,
              "Email": mail,
              "Password": hpassword
          };
          await db.collection('wd401').add(data);
          res.render("thirdpage.ejs", { temp: null, city: null,userPlaces:null,hello:"Hello"+" "+name,nofound:null});
      }
});

    app.post('/login',async(req,res)=>{
        const email = req.body.lmail;
        req.session.email = email;
        const user1Snapshot = await db.collection('wd401').where('Email', '==', email).get();
        if (user1Snapshot.empty) {
            res.render('login.ejs', { wrong: 'Invalid username or password' });
            return;
          }
          const user1Data = user1Snapshot.docs[0].data();
          const hPassword = user1Data.Password;
        const password = req.body.lpassword;
        bcrypt.compare(password, hpassword, function(err, result) {
        db.collection('wd401')
        .where("Email","==",email)
        .where("Password","==",password)
        .get()
        .then((docs)=>{
          if(docs.size>0)
          {
            const name1 = user1Data.Name;
            req.session.name1=name1;
            res.render("thirdpage.ejs",{temp:null,city:null,userPlaces:null,hello:"Hello"+" "+name1,nofound:null});
          }
          else{
            res.render("login.ejs",{wrong:"Invalid username or password"})
          }
        });
      });
          
      });

      app.post('/login/thirdpage', async function (req, res) {
        const place = req.body.place;
        const email1 = req.session.email;
        let cityFound = false;
      
        if (!email1) {
          return res.status(400).send('Email not defined');
        }
      
        try {
          const userQuerySnapshot = await db.collection('wd401').where('Email', '==', email1).get();
          if (userQuerySnapshot.empty) {
            return res.status(404).send('User not found');
          }
      
          const userDoc = userQuerySnapshot.docs[0];
          const userData = userDoc.data();
      
          if (!userData.Places) {
            userData.Places = [];
          }
      
          userData.Places.push(place);
      
          await db.collection('wd401').doc(userDoc.id).update({ Places: userData.Places });
          axios.get(`http://api.weatherapi.com/v1/forecast.json?key=325d06f62de14a37ae4102306232905&q=${place}&days=7`)
            .then(response => {
              if (response.data.current) {
                cityFound = true; 
              }      
              res.render('thirdpage.ejs', {
                city: cityFound ? place : null,
                temp: cityFound ? response.data.current.temp_c : null,
                userPlaces: userData.Places,
                hello: "Hello " + req.session.name1,
                nofound: cityFound ? null : "No city found!!"
              });
            })
            .catch(err => {
              console.error('Weather API Error:');
              res.render('thirdpage.ejs', {
                city: cityFound ? place : null,
                temp: cityFound ? response.data.current.temp_c : null,
                userPlaces: userData.Places,
                hello: "Hello " + req.session.name1,
                nofound: cityFound ? null : "No city found!!"
              });
            });
        } catch (error) {
          console.error('Firestore Error:', error);
          res.status(500).send('Internal Server Error');
        }
      });
      
      
app.listen(3000, function () {

    console.log('Example app listening on port 3000!')
    
    })
