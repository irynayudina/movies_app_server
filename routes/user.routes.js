const Router = require('express')
const UserController = require('../controllers/UserController');
const Playlist = require('../models/Playlist');
const Review = require('../models/Review')
const User = require('../models/User')
const router = new Router()
const {ObjectId, mongoose} = require('mongoose');

// get all users or one
// router.get('/login', (req, res, next)=>{
//     if(req.query['user-password-login'] == '' || req.query['user-email-login'] == ''){
//         res.send({error: "empty request"})
//         return
//     }
//     if(Object.keys(req.query).length === 0){
//         User.find({}, function (err, data){
//             if (err)
//                 res.send(err);
//             res.send(data);
//         })
//         return
//     }
//     next();
// }, UserController.logInUser )
router.get('/login', (req, res)=>{
    console.log(req.query)
    if(req.query['user-email-login'] == "" || req.query['user-password-login'] == ""){
        res.json({error: 'Error: empty field(s)'});
    } else {
        const emailLogin = req.query['user-email-login'];
        const passwordLogin =  req.query['user-password-login'];
        User.findOne({email:emailLogin}).select('-__v').exec((err, uL) => {
            if(err){
            console.log(err)
            } else {
                if(uL != null){
                    uL.comparePassword(passwordLogin, (err, match)=>{
                        if(err){
                            console.log(err)
                        } else if (match){
                            res.json(uL);
                        }  else {
                            res.json({error: 'wrong email or password'});
                        }
                    })
                } else {
                    res.json({error: 'User is not found'});
                }            
            }
        })
    }
})
router.get('/all', (req, res)=>{
    User.find({}, function (err, data){
        if (err)
            res.send(err);
        res.send(data);
    })
})
// change password
router.post('/pwreset', (req, res)=>{
    const emailLogin = req.body.em;
    const passwordLogin =  req.body.opw;
    const newPassword = req.body.npw
    User.findOne({email:emailLogin}).select('-__v').exec((err, uL) => {
        if(err){
            console.log(err)
        } else {
            uL.comparePassword(passwordLogin, (err, match)=>{
                if(err){
                    console.log(err)
                } else if (match){
                    uL.password = newPassword;
                    uL.save();
                    res.send(uL)
                    
                }  else {
                    res.json({error: 'wrong email or password'});
                }
            })
            
        }
    })
})
// add new user
router.post('/new', (req, res, next)=>{
    console.log('inside the router');
    console.log(req.body);
    next();}, UserController.saveNewUser)

// ------------------------------------------------------------PLAYLISTS---------------------------------- //
//creating a playlist without films
router.post('/playlist/new', (req, res)=>{
    const plRecord = new Playlist({name: req.body.name, user: req.body.uid})
    plRecord.save((err, nF) => {
        if(err) {
            console.log(err)
            res.send(err)
        } else{
            console.log('saved');
            res.send(nF._id)
        } 
    })
})
//adding a film to playlist and creating it
router.post('/playlist/new/film', (req, res)=>{
    const pliRecord = {filmID: req.body.fid, fname: req.body.fname, watched: false}
    const plRecord = new Playlist({name: req.body.name, user: req.body.uid, items: pliRecord})
    plRecord.save((err, nF) => {
        if(err) {
            res.send(err)
        } else{ res.send(nF)}})
    // Playlist.deleteMany({name: "action movies ver 3"}).then(function(){
    //     console.log("Data deleted"); // Success
    // }).catch(function(error){
    //     console.log(error); // Failure
    // });
    // res.send(':)')
})

//adding film to an existing playlist
router.post('/playlist', (req, res)=>{
    const pliRecord = {filmID: req.body.fid, fname:req.body.fname, watched: false}
    const playlistId = req.body.plid; 
    Playlist.findOne({_id: mongoose.Types.ObjectId(playlistId)}, (err, data)=>{
        if(err){
            res.send(err)
        } else {
            if(data?.items == null){
                res.send (data)
            }
            else if(data.items?.filter(i => i.filmID === req.body.fid).length > 0){
                res.send('this film is already added to this list')
            } else{
                Playlist.findOneAndUpdate({_id: mongoose.Types.ObjectId(playlistId)}, 
                    {$push: {items:pliRecord}}, null, function (err, docs) {
                    if (err){
                        console.log(err)
                        res.json({error:"err"})
                    }
                    else{
                        console.log("Original Doc : ",docs);
                        res.send(docs)
                    }
                 })
            }
        }
    })
})
//get all playlists or of one user or one playlist by id
router.get('/playlist', (req, res)=>{
    console.log(req.query.uid)
    if(req.query?.uid == undefined && req.query?.pid == undefined){
        Playlist.find({}, function (err, data){
            if (err)
                res.send(err);
            // res.contentType('json');
            res.send(data);
        })
    } else if (req.query?.pid != undefined){
        let pid = req.query?.pid
        Playlist.findOne({_id: mongoose.Types.ObjectId(pid)}, function (err, data){
            if (err)
                res.send(err);
            // res.contentType('json');
            res.send(data);
        })
    } else {
        let usr = req.query.uid
        console.log(usr)
        Playlist.find({user: mongoose.Types.ObjectId(usr)}, function (err, data){
            if (err)
                res.send(err);
            // res.contentType('json');
            res.send(data);
        })
    }
})
router.post('/playlist/del', (req, res)=>{
    Playlist.findByIdAndDelete({_id: req.body.pid}, (e, d)=>{
        if(e){
            res.send(e)
        } else {
            res.send(d)
        }
    })
})
router.post('/playlist/public', (req, res)=>{
    Playlist.findById({_id: mongoose.Types.ObjectId(req.body.pid)}, function (err, data){
        if (err){
            res.send(err);
        } else {
            const newPublic = !data.isPublic
            Playlist.findOneAndUpdate({_id: mongoose.Types.ObjectId(req.body.pid)}, 
                {isPublic: newPublic}, {new:true}, function (err, docs) {
                if (err){
                    res.send(err)
                }
                else {
                    res.send(docs)
                }
            })
        }       
    }) 
})
// delete film from playlist
router.post('/playlist/delf', (req, res)=>{
    console.log(req)
    let did = req.body.did
    let pid = req.body.pid
    let newItems = []    
    Playlist.findById({_id: mongoose.Types.ObjectId(pid)}, function (err, data){
        if (err){
            res.send(err);
        } else {
            newItems = data.items.filter(i => i.filmID != did)
            Playlist.findOneAndUpdate({_id: mongoose.Types.ObjectId(pid)}, 
                {items: newItems}, {new:true}, function (err, docs) {
                if (err){
                    res.send(err)
                }
                else {
                    res.send(docs)
                }
            })
        }       
    })    
})
// mark film in playlist as watched 
router.post('/playlist/watched/film', (req, res)=>{
    let wid = req.body.wid
    let pid = req.body.pid
    let newItems = []    
    Playlist.findById({_id: mongoose.Types.ObjectId(pid)}, function (err, data){
        if (err){
            res.send(err);
        } else if(data !=null){
            newItems = data.items
            for(let i = 0; i < newItems.length; i++){
                if(newItems[i].filmID == wid){
                    newItems[i].watched = !newItems[i].watched
                }
            }
            Playlist.findOneAndUpdate({_id: mongoose.Types.ObjectId(pid)}, 
                {items: newItems}, {new:true}, function (err, docs) {
                if (err){
                    res.send(err)
                }
                else {
                    res.send(docs)
                }
            })
        }     
        else{
            res.send("err")
        }  
    })    
})
// ------------------------------------------------------- Reviews --------------------------------------- //
// CREATING NEW REVIEW OF A FILM
router.post('/review', (req, res)=>{
    console.log(req.body)
    try{
        const filmReq = mongoose.Types.ObjectId(req.body.fid);
    } catch (err) {
        res.json({error: "wrong id of film"})
    }
    try{
        const userReq = mongoose.Types.ObjectId(req.body.uid);
    } catch (err) {
        res.json({error: "wrong id of user"})
    }
    const reviewRecord = new Review( {
        film:mongoose.Types.ObjectId(req.body.fid),
        user:mongoose.Types.ObjectId(req.body.uid),
        username:req.body.username,
        text:req.body.text,
        rating:req.body.rating
    })
    reviewRecord.save((err, nF) => {
        if(err) {
            console.log(err)
            res.send(err)
        } else{
            console.log('saved');
            res.send(nF)
        } 
    })
})
// answering to a review
router.post('/review/answer', (req, res)=>{
    const reviewId = req.body.rwid; 
    let answerid = '';
    const reviewRecord = new Review( {
        film:mongoose.Types.ObjectId(req.body.fid),
        user:mongoose.Types.ObjectId(req.body.uid),
        text:req.body.text,
        rating:req.body.rating,
        isAnswer:true
    })
    reviewRecord.save((err, nF) => {
        if(err) {
            console.log(err)
        } else{
            console.log('saved');
            answerid = nF._id
        } 
    })
    Review.findOneAndUpdate({_id: mongoose.Types.ObjectId(reviewId)}, 
        {$push: {responses:mongoose.Types.ObjectId(reviewRecord)}}, {new: true}, function (err, docs) {
            console.log('found')
        if (err){
            console.log(err)
            res.send(err)
        }
        else{
            console.log("Original Doc : ",docs);
            res.send(docs)
        }
    })
})
// uppdating review
router.post('/review/update', (req, res)=>{
    let text = req.body.text;
    let rating = req.body.rating
    const reviewId = req.body.rwid;
    Review.findOneAndUpdate({_id: mongoose.Types.ObjectId(reviewId)}, 
        {text: text, rating: rating, isUpdated: true}, {new: true}, function (err, docs) {
            console.log('found')
        if (err){
            console.log(err)
            res.send(err)
        }
        else{
            console.log("Original Doc : ",docs);
            res.send(docs)
        }
    })
})
// getting all reviews or of user or of film
router.get('/review', (req, res)=>{
    const user = req.query.uid 
    const film = req.query.fid
    if(req.query.uid == undefined && req.query.fid == undefined){
        Review.find({})
        .sort({createdAt: 'desc' })
        .exec(function (err, docs) {
            if (err){ 
                console.log(err)
                res.send(err)
            }
            else{
                console.log("Original Doc : ",docs);
                docs.map(doc => console.log(doc.createdAt))
                
                res.send(docs)
            }
        });
    } else if(req.query.fid != undefined){
        Review.find({film: mongoose.Types.ObjectId(film)})
        .sort({createdAt: 'desc' })
        .exec(function (err, docs) {
            if (err){ 
                console.log(err)
                res.send(err)
            }
            else{
                console.log("Original Doc : ",docs);
                res.send(docs)
            }
        })
    } else {
        Review.find({user: mongoose.Types.ObjectId(user)})
        .sort({createdAt: 'desc' })
        .exec(function (err, docs) {
            if (err){ 
                console.log(err)
                res.send(err)
            }
            else{
                console.log("Original Doc : ",docs);
                res.send(docs)
            }
        })
    }
    
})
// delete review 
router.post('/review/del', (req, res)=>{
    let text = '';
    let rating = 0
    const reviewId = req.query.rwid;
    Review.findOneAndUpdate({_id: mongoose.Types.ObjectId(reviewId)}, 
        {text: text, rating: rating, isDeleted: true}, {new: true}, function (err, docs) {
            console.log('found')
        if (err){
            console.log(err)
            res.send(err)
        }
        else{
            console.log("Original Doc : ",docs);
            res.send(docs)
        }
    })
})
router.post('/review/del/full', (req, res)=>{
    const reviewId = req.body.rwid;
    Review.findOneAndDelete({_id: mongoose.Types.ObjectId(reviewId)}, function (err, docs) {
            console.log('found')
        if (err){
            console.log(err)
            res.json({error: "err"})
        }
        else{
            console.log("Original Doc : ",docs);
            Review.find({})
            .sort({createdAt: 'desc' })
            .exec(function (err, docs) {
                if (err){ 
                    console.log(err)
                    res.json({error: "err"})
                }
                else{
                    console.log("Original Doc : ",docs);
                    docs.map(doc => console.log(doc.createdAt))
                    
                    res.send(docs)
                }
            });
            }
    })
})
module.exports = router