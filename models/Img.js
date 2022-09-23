var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var Img = new Schema({
    filmId: {type: String, required: true},
    img: { data: Buffer, contentType: String}
}, {
    timestamps: true
});
module.exports = mongoose.model('Img', Img);