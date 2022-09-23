const {Schema, model, ObjectId} = require('mongoose')

const Film = new Schema({
    name: {type: String, required: true},
    actors:{type: [String]},
    director:{type: [String]},
    imdb:{type: Number},
    description:{type: String},
    release:{type: String},
    genres:{type: [String]},
    typefm: {type: String},
    image:{type: Object }

})

module.exports = model('Film', Film)