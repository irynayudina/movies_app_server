const Film = require('../models/Film')


class FilmController {
    saveNewFilm = (req, res, next)=>{
        if(req.body['film-name'] == ""){            
            res.json({error:"name can`t be empty"})
            // || req.body['film-actors'] == "" || req.body['film-director'] == "" 
            // || req.body[''] == "" || req.body[''] == "" || req.body[''] == "" || req.body[''] == "" || req.body[''] == "" || req.body[''] == ""
        }
        let fn = req.body['film-name'];
        Film.findOne({name: fn}).exec((err, data)=>{
        if(err) {
            console.log(err)
        } 
        else if(data == null){ 
            let actorsArray = null;
            if(req.body['film-actors'] != ""){
                actorsArray = req.body['film-actors'].split(',').map(element => element.trim());
            }
            let directorsArray = null;
            if(req.body['film-director'] != ""){
                directorsArray = req.body['film-director'].split(',').map(element => element.trim());
            }
            let genresArray = null;
            if(req.body['film-genres'] != ""){
                genresArray = req.body['film-genres'].split(',').map(element => element.trim());
            }
            let name = "";
            if(req.body['film-name'] != ""){
                name = req.body['film-name'];
            }
            let imdb = 0;
            if(req.body['film-imdb']){
                imdb = req.body['film-imdb'];
            }
            let description = null;
            if(req.body['film-description'] != ""){
                description = req.body['film-description']
            }
            let release = new Date(req.body['film-release']);
            if(release.getFullYear() === NaN){
                release = new Date()
            }
            const filmRecord = new Film({
                name: name,
                actors: actorsArray,
                director: directorsArray,
                imdb: parseFloat(imdb),
                description: description,
                release: release,
                genres: genresArray,
                typefm: req.body['typefm']
            })
            filmRecord.save((err, nF) => {
            if(err) {
                console.log(err)
                next()
            } else{
                console.log('saved');
                console.log(nF._id)
                req.madeFilmId = nF._id
                next()
            } 
            })
        }
        else {
        req.madeFilmId = 'film with this name is already created'
        next()
        }
        });
    }
};

module.exports = new FilmController();