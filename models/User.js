
const {Schema, model, ObjectId} = require('mongoose')
const bcrypt = require("bcryptjs")

const User= new Schema({
    email:{type: String, required:true},
    password:{type: String, required:true},
    name:{type: String, required:true},
    userIsNew:{type:Boolean},
    pwAttempts:{type:Number, default:0},
    pwAttemptTime:{type:Date}
}, {
  timestamps: true
})

User.pre("save", function (next) {
  const user = this
  if (this.isModified("password") || this.isNew) {
    bcrypt.genSalt(10, function (saltError, salt) {
      if (saltError) { 
        return next(saltError)
      } else {
        bcrypt.hash(user.password, salt, function(hashError, hash) {
          if (hashError) {
            return next(hashError)
          }
          user.password = hash
          next()
        })
      }
    })
  } else {
    return next()
  }
})

User.methods.comparePassword = function(password, callback) {
  bcrypt.compare(password, this.password, function(error, isMatch) {
    if (error) {
      return callback(error)
    } else {
      callback(null, isMatch)
    }
  })
}

module.exports = model('User', User)