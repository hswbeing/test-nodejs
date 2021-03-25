var express = require('express');
var fetch = require('node-fetch');
var router = express.Router();
var refresh_token = process.env.REFRESH_TOKEN; // "development"

const fs = require('fs');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/acc', function(req, res, next) {
  let acc = JSON.parse(fs.readFileSync('responses/acc.json'));
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(acc));
});

router.get('/deposits', function(req, res, next) {
  let deposits = JSON.parse(fs.readFileSync('responses/deposits.json'));
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(deposits));
});

router.get('/trusts', async function(req, res, next) {
  let trusts = JSON.parse(fs.readFileSync('responses/trusts.json'));
  res.setHeader('Content-Type', 'application/json');
  console.log("refresh_token: " + refresh_token);
  console.log(`https://sim.logonvalidation.net/token?grant_type=refresh_token&refresh_token=${refresh_token}&redirect_uri=https://oauth.pstmn.io/v1/callback`)
  // Call refresh token API
  const refreshTokenResponse = await fetch(
    `https://sim.logonvalidation.net/token?grant_type=refresh_token&refresh_token=${refresh_token}&redirect_uri=https://oauth.pstmn.io/v1/callback`, {
      method: "post",
      headers: {
        "Authorization": "Basic OTJiOTczMDExZjI0NDliY2JmMzIxODEyZmYwYmIwMmE6ODFlN2YyYWQ2NzJiNDNhZDlhNTQxMjBhZDZlMGE0ZDI="
      }
    }
  ).catch(err => console.error(err));
  const refreshTokenResponseJson = await refreshTokenResponse.json();
  console.log("refreshTokenResponse: " + JSON.stringify(refreshTokenResponseJson));
  let token = refreshTokenResponseJson.access_token;
  refresh_token = refreshTokenResponseJson.refresh_token;
  console.log("token: " + token);
  console.log("refresh_token: " + refresh_token);
  // Call Saxo's Net Position API
  const positionResponse = await fetch(
    'https://gateway.saxobank.com/sim/openapi/port/v1/netpositions/me/', {
      method: "get",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    }
  ).catch(err => console.error(err));
  const positionResponseJson = await positionResponse.json();
  let positions = positionResponseJson.Data;
  let total = 0;
  for (const position of positions) {
    if (position.NetPositionBase.AssetType == 'Bond') {
      // Call Saxo's Instruments API
      const instrumentResponse = await fetch(
        `https://gateway.saxobank.com/sim/openapi/ref/v1/instruments/details/${position.NetPositionBase.Uic}/Bond`, {
          method: "get",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      ).catch(err => console.error(err));
      const instrument = await instrumentResponse.json();
      let profolio = {
        "productID": position.NetPositionBase.Uic,
        "productName": instrument.Description,
        "riskLevel": "",
        "prodCcy": instrument.CurrencyCode,
        "noOfUnits": position.NetPositionBase.Amount,
        "prevClosePrice": position.NetPositionView.CurrentPrice,
        "prevClosePriceType": position.NetPositionView.ExposureCurrency,
        "unitDecimalPoint": 2,
        "exchangeRate": position.NetPositionView.ConversionRateCurrent,
        "marketValue": position.NetPositionView.MarketValue,
        "marketValueHKD": position.NetPositionView.MarketValue * 7.8,
        "marketValueHKDType": "HKD"
      }
      total = total + position.NetPositionView.MarketValue;
      trusts.data.userData.accountDetails[0].portfolioDetails.push(profolio);
    }
  }
  console.log("total: " + total);
  trusts.data.userData.accountDetails[0].totalNetAssetValue = total;
  trusts.data.userData.accountDetails[0].totalNetAssetHKDValue = total * 7.8;

  total = total * 7.8;
  let accTotal = 0;
  // Update acc json
  let acc = JSON.parse(fs.readFileSync('responses/acc.json'));
  acc.data.userData.cardList.forEach((card) => {
    console.log("card.labelName: " + card.labelName);
    if (card.labelName == "UnitTrust") {
      card.totalBalance = total
      card.totalAssetsEQV = total
      accTotal = accTotal + total;
    }
    if (card.labelName == "Deposit") {
      accTotal = accTotal + card.totalBalance;
    }
    if (card.labelName == "Securities") {
      accTotal = accTotal + card.totalBalance;
    }
    console.log("accTotal: " + accTotal);
  });
  
  console.log("accTotal: " + accTotal);
  acc.data.userData.totalBalance = accTotal;
  acc.data.userData.totalAssetsEQV = accTotal;

  fs.writeFileSync('responses/acc.json', JSON.stringify(acc, null, 2));

  res.send(JSON.stringify(trusts));
});

router.get('/securities', function(req, res, next) {
  let securities = JSON.parse(fs.readFileSync('responses/securities.json'));
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(securities));
});

router.get('/overview', function(req, res, next) {
  let overview = JSON.parse(fs.readFileSync('responses/overview.json'));
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(overview));
});
module.exports = router;