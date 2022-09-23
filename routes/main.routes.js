const { response } = require('express')
const axios = require("axios");
const Router = require('express')
const router = new Router()

router.get('/', (req, res)=>{
    // const options = {
    // method: 'GET',
    // url: 'https://movies-app1.p.rapidapi.com/api/movies',
    // headers: {
    //     'X-RapidAPI-Key': '3768e730b8msh61cbfb50a9a2d53p11b9f7jsnd6d2460caede',
    //     'X-RapidAPI-Host': 'movies-app1.p.rapidapi.com'
    // }
    // };

    // let movies;
    // axios.request(options).then(function (response) {
    //     movies = response.data.results;
    //     console.log(movies.length);
    //     res.setHeader('Content-Type', 'application/json');
    //     res.json(movies)
    // }).catch(function (error) {
    //     console.error(error);
    // });
    res.send('main page filter films')
})

module.exports = router