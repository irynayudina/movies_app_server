const {Schema, model, ObjectId} = require('mongoose')

const Playlist = new Schema({
    name:{type: String, required:true},
    user:{type: ObjectId, required:true},
    isPublic: { type: Boolean, default: false },
    items: [Object]

})

module.exports = model('Playlist', Playlist)