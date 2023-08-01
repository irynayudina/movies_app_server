const User= require('../models/User')

const pwlifetime = 600000; // 60 000 = 1 minute

function generateAccessToken(user) {
  let expIn = Math.max(
    pwlifetime - (Date.now() - (user.updatedAt || user.createdAt)),
    0
  );
  if (expIn <= 0) {
    let newPassword = genRandPass();
    User.findOne(
      {
        email: user.email,
      },
      (err, uL) => {
        uL.password = newPassword;
        uL.save();
      }
    );
    console.log(newPassword);
    sendEmail(user.email, newPassword);
    return "Check email";
  }
  expIn = expIn.toString();
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: expIn,
  });
}

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
                res.json({error: 'Error creating a user'})
            } else{
                const ret = nU;
                const accessToken = generateAccessToken({
                  _id: nU._id,
                  email: nU.email,
                  password: nU.password,
                  name: nU.name,
                  createdAt: nU.createdAt,
                  updatedAt: nU.updatedAt,
                  userIsNew: nU.userIsNew,
                });
                let ret2 = JSON.parse(JSON.stringify(ret));
                ret2.accessToken = accessToken
                res.json(ret2);
            } 
            })
        } else {
            res.json({error:'User is already created'})
            }
        });}
    }
};

module.exports = new UserController();