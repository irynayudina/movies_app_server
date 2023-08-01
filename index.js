const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require('body-parser')
const dotenv = require('dotenv');
const cors = require('cors')
dotenv.config();
const fs = require("fs");


const mainRouter = require("./routes/main.routes.js")
const filmsRouter = require("./routes/film.routes.js")
const userRouter = require("./routes/user.routes.js");


const app = express();
var corsOptions = {
  origin: `https://movies-app-playlists.netlify.app`, //["https://movies-app-playlists.netlify.app"
};
app.use(cors(corsOptions));
// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*');
//     next();
//   });
app.use(bodyParser.json()) 
app.use(bodyParser.urlencoded({ extended: false }))
app.use('/', mainRouter)
app.use('/films', filmsRouter)
app.use('/user', userRouter)
const start = async () => {
    try {
        mongoose.connect(process.env.MONGO_URI)

        app.listen(process.env.PORT, () => {
            console.log('running on port', process.env.PORT)
        })
    } catch (e) {
        
    }
}
start()
