const {Schema, model, ObjectId} = require('mongoose')

const Review = new Schema({
    film:{type: ObjectId, required:true},
    user:{type: ObjectId, required:true},
    username:{type:String},
    text:{type: String, required:true},
    rating:{type: Number},
    responses: [ObjectId],
    likes: Number,
    dislikes: Number,
    isAnswer:  { type: Boolean, default: false },
    isDeleted:  { type: Boolean, default: false },
    isUpdated:  { type: Boolean, default: false }

}, {
    timestamps: true
})

module.exports = model('Review', Review)