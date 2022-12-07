const User= require('../models/User')

class UserController {
    saveNewUser = (req, res)=>{
        let un = req.body['user-email'];
        if(req.body['user-email'] == "" || req.body['user-password'] == "" || req.body['user-name'] == ""){
            res.json({error:'Error: empty field(s)'})
            return;
        } else {
        User.findOne({email: un}).exec((err, data)=>{
        if(err) {
            console.log(err)
            } 
        else if(data == null){     
            const userRecord = new User({
                email:req.body['user-email'],
                password:req.body['user-password'],
                name:req.body['user-name'],
                userIsNew:req.body['userIsNew']
            })
            userRecord.save((err, nU) => {
            if(err) {
                console.log(err)
            } else{
                res.json(nU);
            } 
            })
        } else {
            res.json({error:'User is already created'})
            }
        });}
    }
};

module.exports = new UserController();