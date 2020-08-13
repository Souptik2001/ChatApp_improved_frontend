const express = require('express');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const fetch = require('node-fetch');
const app = express();
const fs = require('fs');
var bodyParser = require('body-parser');
const proxy = process.env.BACKEND || 'http://localhost:3000';

let options = {
    dotfiles: "ignore", //allow, deny, ignore
    etag: true,
    extensions: ["htm", "html"],
    index: false, //to disable directory indexing
    maxAge: "7d",
    redirect: false,
  };
app.use(express.static("public", options));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }))
function checkingCred(token) {
    return new Promise(async(resolve, reject) => {
        fetch(proxy + `/verify`, {
            method: 'POST',
            headers :{
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token : token
            })
        }).then((res)=> res.json())
        .then(data=> {
            resolve(data);
        });
    });
}

app.get('/', (req, res)=>{
    var cookies_s = req.headers.cookie;
    var auth_token;
    var user_name;
    if (cookies_s != undefined) {
        var cookies = cookies_s.split("; ");
        for (var i = 0; i < cookies.length; i++) {
            if (cookies[i].indexOf("authorization=") == 0) {
                auth_token = cookies[i].substring("authorization=".length, cookies[i].length);
            }
            if(cookies[i].indexOf("name=") == 0){
                user_name = cookies[i].substring("name=".length, cookies[i].length);
            }
        }
        if (auth_token != undefined) {
            checkingCred(auth_token).then((data)=>{
                if(data["Error"]){
                    res.redirect('/login');
                }else{
                    fs.readFile('./public/views/index.html', 'utf-8', (err, data)=>{
                        if(err){
                            console.log(err);
                            res.send("Sorry some server err occured");
                        }else{
                            res.send(data);
                        }
                    });
                }
            });

        } else {
            res.redirect('/login');
        }
    }else{
        res.redirect('/login');
    }
});

app.get('/login', (req, res)=>{
    var cookies_s = req.headers.cookie;
    var auth_token;
    if (cookies_s != undefined) {
        var cookies = cookies_s.split("; ");
        for (var i = 0; i < cookies.length; i++) {
            if (cookies[i].indexOf("authorization=") == 0) {
                auth_token = cookies[i].substring("authorization=".length, cookies[i].length);
            }
        }
        if (auth_token != undefined) {
            checkingCred(auth_token).then((data)=>{
                if(data.Error){
                    console.log("Verification required");
                }else{
                    res.redirect('/');
                }
            });

        }
    }
    fs.readFile('./public/views/login.html', 'utf-8', (err, data)=>{
        if(err){
            console.log(err);
            res.send("Sorry some server err occured");
        }else{
            res.send(data);
        }
    });
});

function checkCred(cred_user, cred_pass) {
    return new Promise(async(resolve, reject) => {
        // var endpoint = '';
        var proxy = 'http://localhost:3000';
        if (cred_pass != "" && cred_user!= "") {
            fetch(proxy + `/login`, {
                method: 'POST',
                headers:{
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user: cred_user,
                    pass: cred_pass
                })
            }).then(res=> res.json()).then(data=>{console.log(data); resolve(data);});
        }else{
            resolve();
        }
    });
}

app.post('/verifyCred', (req, res)=>{
    checkCred(req.body.uname, req.body.pass).then(msg => {
        if(msg!=undefined){
            if(msg.token=="error"){
                res.json({"Error": "Invalid username or Password"});
            }else{
                console.log(msg);
                var d = new Date();
                d.setTime(d.getTime() + (30*24*60*60*1000)); // the first 30 is the number of days the cookie will stay
                var expires = d.toUTCString();
                res.cookie('authorization', msg.token, { maxAge: 9000000000 });
                res.cookie('name', msg.name, { maxAge: 9000000000 });
                res.redirect('/');
            }
        }
    });
});


app.listen(process.env.PORT || 5000, () => console.log(`Server on http://localhost:5000`));