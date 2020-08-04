const express = require('express');
var ejs = require('ejs');
const app = express();
// const proxy = process.env.BACKEND || 'http://localhost:3000';

app.set('views', './views');
app.set('view engine', 'ejs');

function generateRandomString(length) {
    var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var random_string = '';
    if (length > 0) {
        for (var i = 0; i < length; i++) {
            random_string += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    }
    return random_string;
}

// app.get('/', (req, res) => {
//     var cookies_s = req.headers.cookie;
//     var auth_token;
//     if (cookies_s != undefined) {
//         var cookies = cookies_s.split("; ");
//         for (var i = 0; i < cookies.length; i++) {
//             if (cookies[i].indexOf("authorization=") == 0) {
//                 auth_token = cookies[i].substring("authorization=".length, cookies[i].length);
//                 break;
//             }
//         }
//         if (auth_token != undefined) {
//             jwt.verify(auth_token, 'secret_key', (err, user) => {
//                 if (err) {
//                     res.send("Some error occured in your token verification or token has been tampered. Try logging in again :[");
//                 }
//                 res.render('index', { data: { user: user } });
//             });
//         } else {
//             res.redirect('/login');
//         }
//     } else {
//         res.redirect('/login');
//     }
// });

app.get('/', (req, res)=>{
    res.render('index', { data: { user: "user" } });
});


app.post('/login', (req, res) => {
    console.log("Hey");
    if (req.body.email != undefined & req.body.endpoint != undefined) {
        var q = `SELECT * FROM logins WHERE username=\'${req.body.email}\' OR email=\'${req.body.email}\'`;
        connection.query(q, (err, result) => {
            if (err) {
                console.log(err);
                res.send("Somme internal error occuder try after sometime");
            } else {
                if (result[0] != undefined) {
                    var secret_token = generateRandomString(30);
                    var mailOptions = {
                        from: 'FunChat',
                        to: result[0].email,
                        subject: 'Email verification',
                        html: `<strong>Click on this link to verify your email and log in (It is valid for only one hour) :</strong> <a href="${req.body.endpoint}/verify?secretToken=${secret_token}">Verify Here</a>`
                    };
                    var q = `UPDATE logins SET token=\'${secret_token}\',token_expire=${(Math.round((new Date()).getTime() / 1000))+3600} WHERE username=\'${req.body.email}\' OR email=\'${req.body.email}\'`;
                    connection.query(q, (err, result) => {
                        if (err) {
                            console.log(err);
                            res.send("Some err occured");
                        } else {
                            transporter.sendMail(mailOptions, function(error, info) {
                                if (error) {
                                    console.log(error);
                                    res.send("Some error occured please check the email");
                                } else {
                                    console.log('Email sent: ' + info.response);
                                    res.send("Click on the link send to the email to log in. It is valid for only one hour.");
                                }
                            });
                        }
                    });
                } else {
                    res.send("User doesn't exist"); //Later will put redirection
                }
            }
        });
    } else {
        res.send("Email or endpoint not properly typed");
    }
});
app.get('/verify', (req, res) => {
    var userNameAndEmail;
    if (req.query.secretToken != undefined) {
        var q = `SELECT * FROM \`logins\` WHERE token=\'${req.query.secretToken}\' AND token_expire>${Math.round((new Date()).getTime() / 1000)}`;
        connection.query(q, (err, result) => {
            if (err) {
                res.send(err);
            } else {
                if (result[0] != undefined) {
                    userNameAndEmail = {
                        username: result[0].username,
                        email: result[0].email
                    };
                    var q = `UPDATE logins SET token="",token_expire=0 WHERE username=\'${result[0].username}\' AND email=\'${result[0].email}\'`;
                    connection.query(q, (err, result) => {
                        if (err) {
                            res.json({
                                "Error": "Try again"
                            });
                        } else {
                            const access_token = jwt.sign(userNameAndEmail, 'secret_key');
                            res.cookie('authorization', access_token, { maxAge: 9000000000000 });
                            res.redirect('/');
                        }
                    });
                } else {
                    res.send("The url is invalid or expired ! ");
                }
            }
        });
    } else {
        res.send("Secret token was not found");
    }
});



app.listen(process.env.PORT || 5000, () => console.log(`Server on http://localhost:5000`));