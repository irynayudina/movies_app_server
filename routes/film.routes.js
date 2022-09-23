const Router = require('express')
const FilmController = require('../controllers/FilmController')
const router = new Router()

const express = require("express")
const fs = require('fs');
const multer  = require("multer");

const {ObjectId, mongoose} = require('mongoose');
var Img = require('../models/Img');
const Film = require('../models/Film');
const Playlist = require('../models/Playlist')

 
const storageConfig = multer.diskStorage({
    destination: (req, file, cb) =>{
        // __dirname = 'D:\\projects\\movies app';
        // console.log(__dirname);
        cb(null, "uploads");
    },
    filename: (req, file, cb) =>{
        cb(null, file.originalname);
    }
});
// определение фильтра
const fileFilter = (req, file, cb) => {
  
    if(file.mimetype === "image/png" || 
    file.mimetype === "image/jpg"|| 
    file.mimetype === "image/jpeg"){
        cb(null, true);
    }
    else{
        cb(null, false);
    }
 }
 
router.use(express.static('D:\\projects\\movies app')) // router.use(express.static(__dirname));
 
router.use(multer({storage:storageConfig, fileFilter: fileFilter}).single("filmImage"));
router.post("/upload",  FilmController.saveNewFilm, function (req, res, next) {
   
    let filedata = req.file;//req.file;
    console.log("file passed");
    console.log(filedata);
    if(!filedata)
        res.json({picError:"Error uploading file"})
    else {
        console.log(req.madeFilmId)
        var new_img = new Img;
        new_img.filmId = req.madeFilmId
        new_img.img.data = fs.readFileSync(req.file.path)//file.path)
        new_img.img.contentType = 'image/jpeg';
        new_img.save();
        Film.findByIdAndUpdate({_id:req.madeFilmId}, {image: new_img}, {new: true}, (err, updatedFilm) =>{    
            if(err){
                res.json({error:"err"})
            }   else {
            res.json(updatedFilm);}
        });
    }
        
});
// get all films
router.get("/all", function(req, res){
    Film.find({}, function (err, data){
        if (err)
            res.send(err);
        // res.contentType('json');
        res.send(data);
    }).sort({ _id: 'desc' });
})
// get filtered films
router.get('/filter', function(req, res){
    // ?name=&actors=&director=&sortWay=yearSort&genres=&typefm
    let filterObj = {};
    let sw = {};
    if(req.query.sortWay == 'yearSort'){
        sw = {release: 'desc'};
    } else {
        sw = {imdb: 'desc' }
    }
    if(req.query.name){
        filterObj['name'] = {$regex : /Citizen/, $options : 'i'};
        filterObj['name'].$regex = req.query.name     
        filterObj['name'].$options = 'i';  
    }
    if(req.query.actors){
        filterObj['actors'] = {$all: ["Realm", "Charts"]};
        filterObj['actors'].$all = req.query.actors.split(',').map(element => element.trim())
    }
    if(req.query.directors){
        filterObj['director'] = {$all: ["Realm", "Charts"]};
        filterObj['director'].$all = req.query.directors.split(',').map(element => element.trim())
    }
    if(req.query.genres){
        filterObj['genres'] = {$all: ["Realm", "Charts"]};
        filterObj['genres'].$all = req.query.genres.split(',').map(element => element.trim())
    }
    if(req.query.typefm){
        filterObj['typefm'] = {$regex : /Citizen/, $options : 'i'};
        filterObj['typefm'].$regex = req.query.typefm     
        filterObj['typefm'].$options = 'i';  
    }
    console.log(filterObj)
    Film.find(filterObj || {}, function (err, data){
        if (err)
            res.send(err);
        res.contentType('json');
        res.send(data);
    }).sort(sw);
})
// getting films by name
router.get("/name", function(req, res){
    const filmId = req.params.id
    let filterObj = {};
    filterObj['name'] = {$regex : /Citizen/, $options : 'i'};
    filterObj['name'].$regex = req.query.name     
    filterObj['name'].$options = 'i'; 
    Film.find(filterObj, function (err, data){
        if (err)
            res.send(err);
        res.send(data);
    }).sort({ _id: 'desc' });
})
// get one film by id
router.get("/id", function(req, res){
    const filmId = req.query.id
    Film.findOne({_id: mongoose.Types.ObjectId(filmId)}, function (err, data){
        if (err)
            res.send(err);
        res.send(data);
    });
})

module.exports = router