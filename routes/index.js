var express = require('express');
var router = express.Router();

/* pull all env into a string */
let strValue  = '';

Object.keys(process.env).forEach( function (key) {
  strValue += key + '=' + process.env[key] + '\n';
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'env values' , text: strValue });
});

module.exports = router;
