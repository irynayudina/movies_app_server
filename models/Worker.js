const { ObjectId } = require('mongodb')
const {Schema, model, ObjectId} = require('mongoose')

const Worker = new Schema({
    name:{type: String, required:true},
    image:{type: String, required:true},
    bio:{type: String, required:true},
    age:{type: Number},
    height:{type: String},
    spouses:{type: [String]},
    children:{type: [String]},
    parents:{type: [String]},
    roles:{type: [String]}

})

module.exports = model('Worker', Worker)