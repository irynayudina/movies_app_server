const User= require('../models/User')

class UserController {
    logInUser = (req, res) =>{
        if(Object.keys(req.query).length === 0){
            res.send('empty query')
        } else {
        const emailLogin = req.query['user-email-login'] || "user@mail";
        console.log(emailLogin);
        const passwordLogin =  req.query['user-password-login'] || "password";
        User.findOne({email:emailLogin}).select('-__v').exec((err, uL) => {
            if(err){
              console.log(err)
            } else {
                uL.comparePassword(passwordLogin, (err, match)=>{
                    if(err){
                        console.log(err)
                    } else if (match){
                        res.json(uL);
                    }  else {
                        res.json({error: 'wrong email or password'});
                    }
                })
              
            }
        })
        }
    }
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
                name:req.body['user-name']
            })
            userRecord.save((err, nU) => {
            if(err) {
                console.log(err)
            } else{
                console.log('saved');
                res.json(nU);
            } 
            })
        }
            else {
            res.json({error:'User is already created'})
            return;
            }
        });}
    }
};

module.exports = new UserController();