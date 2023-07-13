const Router = require('express')
const UserController = require('../controllers/UserController');
const Playlist = require('../models/Playlist');
const Review = require('../models/Review')
const User = require('../models/User')
const router = new Router()
const {ObjectId, mongoose} = require('mongoose');
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const pwlifetime = 120000; // 60 000 = 1 minute in ms 2 min
const minpwlifetime = 60000; // 1 min
const pwInterval = 10000; // 10 seconds

function genRandPass() {
    let spchars = '!@#$%^&*()~'
    let randpass = Math.random().toString(36).slice(2) +
        Math.random().toString(36)
        .toUpperCase().slice(2);
    for (let j = 0; j < 3; j++) {
        let sci = Math.random() * spchars.length
        let i = 1 + Math.random() * (randpass.length - 1)
        randpass = randpass.slice(0, i) + spchars.charAt(sci) + randpass.slice(i);
    }
    return randpass;
}
async function sendEmail(email, pw) {
    try {
        const smtpTransport = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
          },
        });
        const mailOptions = {
          to: email,
          from: "Movies App",
          subject: "Password Reset",
          text:
            "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
            "New password is: " +
            pw +
            "\n\n",
        };
        await smtpTransport.sendMail(mailOptions);
    } catch (error) {
        console.log(error)
    }

    console.log(email, pw);

}

function generateAccessToken(user) {
    let expIn;
    if (user.updatedAt) {
        expIn = user.updatedAt
    } else {
        expIn = user.createdAt
    }
    expIn = pwlifetime - (Date.now() - expIn);
    if (expIn <= 0) {
        let newPassword = genRandPass();
        User.findOne({
            email: user.email
        }, (err, uL) => {
            uL.password = newPassword;
            uL.save();
        });
        console.log(newPassword)
        sendEmail(user.email, newPassword)
        return "Check email"
    }
    expIn = expIn.toString();
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: expIn
    })
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        console.log(err)
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}

router.post('/login', (req, res) => {
    const emailLogin = req.body['user-email-login'];
    const passwordLogin = req.body['user-password-login'];
    if (emailLogin == "" || passwordLogin == "") {
        return res.json({
            error: 'Error: empty field(s)'
        });
    }
    let attempts = 0;
    User.findOne({
        email: emailLogin
    }).select('-__v').exec((err, uL) => {
        if (err) {
            console.log(err)
        } else {
            if (uL != null) {
                let prevAttemptTime = uL.pwAttemptTime || 0;
                attempts = uL.pwAttempts
                if ((Date.now() - prevAttemptTime) > pwInterval) {
                    if (uL.pwAttempts > 3) {
                        return res.json({
                            error: "All 3 attempts have been used. User is blocked"
                        })
                    }
                    uL.comparePassword(passwordLogin, (err, match) => {
                        if (err) {
                            console.log(err)
                        } else if (match) {
                            uL.pwAttempts = 0;
                            uL.save();
                            const accessToken = generateAccessToken({
                                _id: uL._id,
                                email: uL.email,
                                password: uL.password,
                                name: uL.name,
                                createdAt: uL.createdAt,
                                updatedAt: uL.updatedAt,
                                userIsNew: uL.userIsNew
                            })
                            let ret = JSON.parse(JSON.stringify(uL));
                            if (accessToken == "Check email") {
                                res.json({
                                    pwEmail: "This password is expired. Check email for a new one"
                                })
                            } else {
                                ret.accessToken = accessToken
                                return res.json(ret);
                            }
                        } else {
                            uL.pwAttemptTime = Date.now()
                            uL.pwAttempts = uL.pwAttempts + 1;
                            uL.save()
                            res.json({
                                error: 'Wrong email or password. New attempt in ' + pwInterval + 'ms. Try ' + uL.pwAttempts + " of 3",
                                pwWait: pwInterval
                            });
                        }
                    })
                }
            } else {
                res.json({
                    error: 'User is not found'
                });
            }
        }
    })
})
router.get('/all', (req, res) => {
    User.find({}, function (err, data) {
        if (err) {
            return res.send(err);   
        }
        res.send(data);
    })
})
router.post('/forgotpassword', (req, res) => {
    let em = req.body['user-email-login'];
    if (em == "") {
        return res.json({
            error: "Email is required"
        })
    }
    let newPw = genRandPass()
    User.findOne({
        email: em
    }, (err, uL) => {
        if (!err) {
            uL.password = newPw;
            uL.pwAttempts = 0;
            uL.save();
        }
    });
    console.log(newPw)
    sendEmail(em, newPw)
    res.json({
        pwEmail: "New password has been sent to your email"
    })
})
// change password
router.post('/pwreset', authenticateToken, (req, res) => {
    const emailLogin = req.body.em;
    const passwordLogin = req.body.opw;
    const newPassword = req.body.npw
    if (emailLogin == "" || passwordLogin == "" || newPassword == "") {
        res.json({
            error: 'Error: empty field(s)'
        });
        return;
    }
    User.findOne({
        email: emailLogin
    }).select('-__v').exec((err, uL) => {
        if (err) {
            console.log(err)
        } else {
            uL.comparePassword(passwordLogin, async (err, match) => {
                if (err) {
                    console.log(err)
                } else if (match) {
                    let expIn = 0
                    if (uL.updatedAt) {
                        expIn = uL.updatedAt
                    } else {
                        expIn = uL.createdAt
                    }
                    expIn = minpwlifetime - (Date.now() - expIn);
                    if (expIn > 0) {
                        const authHeader = req.headers['authorization']
                        const token = authHeader && authHeader.split(' ')[1]
                        let ret2 = JSON.parse(JSON.stringify(uL));
                        ret2.error = 'Too early to change password. Try again later in ' + expIn + "ms"
                        ret2.pwWait = expIn
                        ret2.accessToken = token
                        res.json(ret2);
                    } else {
                        uL.password = newPassword;
                        uL.userIsNew = false;
                        const ret = await uL.save();
                        const accessToken = generateAccessToken({
                            _id: uL._id,
                            email: uL.email,
                            password: uL.password,
                            name: uL.name,
                            createdAt: uL.createdAt,
                            updatedAt: uL.updatedAt,
                            userIsNew: uL.userIsNew
                        })
                        let ret2 = JSON.parse(JSON.stringify(ret));
                        ret2.accessToken = accessToken
                        res.json(ret2);
                    }
                } else {
                    res.json({
                        error: 'wrong email or password'
                    });
                }
            })
        }
    })
})
// add new user
router.post('/new', (req, res, next) => {
    console.log('inside the router');
    console.log(req.body);
    next();
}, UserController.saveNewUser)
// ------------------------------------------------------------PLAYLISTS---------------------------------- //
//creating a playlist without films
router.post('/playlist/new', authenticateToken, (req, res) => {
    const plRecord = new Playlist({
        name: req.body.name,
        user: req.body.uid
    })
    plRecord.save((err, nF) => {
        if (err) {
            console.log(err)
            res.send(err)
        } else {
            res.send(nF._id)
        }
    })
})
//adding a film to playlist and creating it
router.post('/playlist/new/film', authenticateToken, (req, res) => {
    const pliRecord = {
        filmID: req.body.fid,
        fname: req.body.fname,
        watched: false
    }
    const plRecord = new Playlist({
        name: req.body.name,
        user: req.body.uid,
        items: pliRecord
    })
    plRecord.save((err, nF) => {
        if (err) {
            res.send(err)
        } else {
            res.send(nF)
        }
    })
})

//adding film to an existing playlist
router.post('/playlist', authenticateToken, (req, res) => {
    const pliRecord = {
        filmID: req.body.fid,
        fname: req.body.fname,
        watched: false
    }
    const playlistId = req.body.plid;
    Playlist.findOne({
        _id: mongoose.Types.ObjectId(playlistId)
    }, (err, data) => {
        if (err) {
            res.send(err)
        } else {
            if (data?.items == null) {
                res.send(data)
            } else if (data.items?.filter(i => i.filmID === req.body.fid).length > 0) {
                res.send('this film is already added to this list')
            } else {
                Playlist.findOneAndUpdate({
                    _id: mongoose.Types.ObjectId(playlistId)
                }, {
                    $push: {
                        items: pliRecord
                    }
                }, null, function (err, docs) {
                    if (err) {
                        console.log(err)
                        res.json({
                            error: "err"
                        })
                    } else {
                        res.send(docs)
                    }
                })
            }
        }
    })
})
//get all playlists or of one user or one playlist by id
router.get('/playlist', authenticateToken, (req, res) => {
    if (req.query?.uid == undefined && req.query?.pid == undefined) {
        Playlist.find({}, function (err, data) {
            if (err) {
                return res.send(err);
            }
            // res.contentType('json');
            res.send(data);
        })
    } else if (req.query?.pid != undefined) {
        let pid = req.query?.pid
        Playlist.findOne({
            _id: mongoose.Types.ObjectId(pid)
        }, function (err, data) {
            if (err)
                res.send(err);
            // res.contentType('json');
            res.send(data);
        })
    } else {
        let usr = req.query.uid
        Playlist.find({
            user: mongoose.Types.ObjectId(usr)
        }, function (err, data) {
            if (err)
                res.send(err);
            // res.contentType('json');
            res.send(data);
        })
    }
})
//playlist public
router.get('/playlistPublic', (req, res) => {
    if (req.query?.uid == undefined && req.query?.pid == undefined) {
        Playlist.find({}, function (err, data) {
            if (err) {
                return res.send(err);
            }
            // res.contentType('json');
            res.send(data);
        })
    } else if (req.query?.pid != undefined) {
        let pid = req.query?.pid
        Playlist.findOne({
            _id: mongoose.Types.ObjectId(pid)
        }, function (err, data) {
            if (err)
                res.send(err);
            // res.contentType('json');
            res.send(data);
        })
    } else {
        let usr = req.query.uid
        Playlist.find({
            user: mongoose.Types.ObjectId(usr)
        }, function (err, data) {
            if (err)
                res.send(err);
            // res.contentType('json');
            res.send(data);
        })
    }
})
router.post('/playlist/del', authenticateToken, (req, res) => {
    Playlist.findByIdAndDelete({
        _id: req.body.pid
    }, (e, d) => {
        if (e) {
            res.send(e)
        } else {
            res.send(d)
        }
    })
})
router.post('/playlist/public', authenticateToken, (req, res) => {
    Playlist.findById({
        _id: mongoose.Types.ObjectId(req.body.pid)
    }, function (err, data) {
        if (err) {
            res.send(err);
        } else {
            const newPublic = !data.isPublic
            Playlist.findOneAndUpdate({
                _id: mongoose.Types.ObjectId(req.body.pid)
            }, {
                isPublic: newPublic
            }, {
                new: true
            }, function (err, docs) {
                if (err) {
                    res.send(err)
                } else {
                    res.send(docs)
                }
            })
        }
    })
})
// delete film from playlist
router.post('/playlist/delf', authenticateToken, (req, res) => {
    let did = req.body.did
    let pid = req.body.pid
    let newItems = []
    Playlist.findById({
        _id: mongoose.Types.ObjectId(pid)
    }, function (err, data) {
        if (err) {
            res.send(err);
        } else {
            newItems = data.items.filter(i => i.filmID != did)
            Playlist.findOneAndUpdate({
                _id: mongoose.Types.ObjectId(pid)
            }, {
                items: newItems
            }, {
                new: true
            }, function (err, docs) {
                if (err) {
                    res.send(err)
                } else {
                    res.send(docs)
                }
            })
        }
    })
})
// mark film in playlist as watched 
router.post('/playlist/watched/film', authenticateToken, (req, res) => {
    let wid = req.body.wid
    let pid = req.body.pid
    let newItems = []
    Playlist.findById({
        _id: mongoose.Types.ObjectId(pid)
    }, function (err, data) {
        if (err) {
            res.send(err);
        } else if (data != null) {
            newItems = data.items
            for (let i = 0; i < newItems.length; i++) {
                if (newItems[i].filmID == wid) {
                    newItems[i].watched = !newItems[i].watched
                }
            }
            Playlist.findOneAndUpdate({
                _id: mongoose.Types.ObjectId(pid)
            }, {
                items: newItems
            }, {
                new: true
            }, function (err, docs) {
                if (err) {
                    res.send(err)
                } else {
                    res.send(docs)
                }
            })
        } else {
            res.send("err")
        }
    })
})
// ------------------------------------------------------- Reviews --------------------------------------- //
// CREATING NEW REVIEW OF A FILM
router.post('/review', authenticateToken, (req, res) => {
    try {
        const filmReq = mongoose.Types.ObjectId(req.body.fid);
    } catch (err) {
        res.json({
            error: "wrong id of film"
        })
    }
    try {
        const userReq = mongoose.Types.ObjectId(req.body.uid);
    } catch (err) {
        res.json({
            error: "wrong id of user"
        })
    }
    const reviewRecord = new Review({
        film: mongoose.Types.ObjectId(req.body.fid),
        user: mongoose.Types.ObjectId(req.body.uid),
        username: req.body.username,
        text: req.body.text,
        rating: req.body.rating
    })
    reviewRecord.save((err, nF) => {
        if (err) {
            console.log(err)
            res.send(err)
        } else {
            res.send(nF)
        }
    })
})
// answering to a review
router.post('/review/answer', authenticateToken, (req, res) => {
    const reviewId = req.body.rwid;
    let answerid = '';
    const reviewRecord = new Review({
        film: mongoose.Types.ObjectId(req.body.fid),
        user: mongoose.Types.ObjectId(req.body.uid),
        text: req.body.text,
        rating: req.body.rating,
        isAnswer: true
    })
    reviewRecord.save((err, nF) => {
        if (err) {
            console.log(err)
        } else {
            answerid = nF._id
        }
    })
    Review.findOneAndUpdate({
        _id: mongoose.Types.ObjectId(reviewId)
    }, {
        $push: {
            responses: mongoose.Types.ObjectId(reviewRecord)
        }
    }, {
        new: true
    }, function (err, docs) {
        if (err) {
            console.log(err)
            res.send(err)
        } else {
            res.send(docs)
        }
    })
})
// uppdating review
router.post('/review/update', authenticateToken, (req, res) => {
    let text = req.body.text;
    let rating = req.body.rating;
    const reviewId = req.body.rwid;
    Review.findOneAndUpdate({
        _id: mongoose.Types.ObjectId(reviewId)
    }, {
        text: text,
        rating: rating,
        isUpdated: true
    }, {
        new: true
    }, function (err, docs) {
        if (err) {
            console.log(err)
            res.send(err)
        } else {
            res.send(docs)
        }
    })
})
// getting all reviews or of user or of film
router.get('/review', (req, res) => {
    const user = req.query.uid
    const film = req.query.fid
    if (req.query.uid == undefined && req.query.fid == undefined) {
        Review.find({})
            .sort({
                createdAt: 'desc'
            })
            .exec(function (err, docs) {
                if (err) {
                    console.log(err)
                    res.send(err)
                } else {
                    docs.map(doc => console.log(doc.createdAt))

                    res.send(docs)
                }
            });
    } else if (req.query.fid != undefined) {
        Review.find({
                film: mongoose.Types.ObjectId(film)
            })
            .sort({
                createdAt: 'desc'
            })
            .exec(function (err, docs) {
                if (err) {
                    console.log(err)
                    res.send(err)
                } else {
                    res.send(docs)
                }
            })
    } else {
        Review.find({
                user: mongoose.Types.ObjectId(user)
            })
            .sort({
                createdAt: 'desc'
            })
            .exec(function (err, docs) {
                if (err) {
                    console.log(err)
                    res.send(err)
                } else {
                    res.send(docs)
                }
            })
    }

})
// delete review 
router.post('/review/del', authenticateToken, (req, res) => {
    let text = '';
    let rating = 0
    const reviewId = req.query.rwid;
    Review.findOneAndUpdate({
        _id: mongoose.Types.ObjectId(reviewId)
    }, {
        text: text,
        rating: rating,
        isDeleted: true
    }, {
        new: true
    }, function (err, docs) {
        if (err) {
            console.log(err)
            res.send(err)
        } else {
            res.send(docs)
        }
    })
})
router.post('/review/del/full', authenticateToken, (req, res) => {
    const reviewId = req.body.rwid;
    Review.findOneAndDelete({
        _id: mongoose.Types.ObjectId(reviewId)
    }, function (err, docs) {
        if (err) {
            console.log(err)
            res.json({
                error: "err"
            })
        } else {
            Review.find({})
                .sort({
                    createdAt: 'desc'
                })
                .exec(function (err, docs) {
                    if (err) {
                        console.log(err)
                        res.json({
                            error: "err"
                        })
                    } else {
                        docs.map(doc => console.log(doc.createdAt))

                        res.send(docs)
                    }
                });
        }
    })
})
module.exports = router