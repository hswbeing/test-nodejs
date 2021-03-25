var express = require('express');
var router = express.Router();

const fs = require('fs');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/acc', function(req, res, next) {
  let acc = JSON.parse(fs.readFileSync('responses/acc.json'))
  res.send(JSON.stringify(acc));
});

router.get('/deposits', function(req, res, next) {
  let deposits = JSON.parse(fs.readFileSync('responses/deposits.json'))
  res.send(JSON.stringify(deposits));
});

router.get('/trusts', function(req, res, next) {
  let trusts = JSON.parse(fs.readFileSync('responses/trusts.json'))
  res.send(JSON.stringify(trusts));
});

router.get('/securities', function(req, res, next) {
  let securities = JSON.parse(fs.readFileSync('responses/securities.json'))
  res.send(JSON.stringify(securities));
});

module.exports = router;