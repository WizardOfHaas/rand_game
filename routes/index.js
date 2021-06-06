var express = require('express');
var router = express.Router();

var MongoClient = require('mongodb').MongoClient;
var useragent = require('express-useragent');
var mongoose = require('mongoose');

var Game = require('../models/game');
var Firm = require('../models/firm');
var FirmState = require('../models/firm_state');
var UpdateOrder = require('../models/update_order');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index.html');
});

function createFirm(options, cb){ //This will need logic to see if we need to create or find a user
  Firm.create({
    name: options.name,
    is_gm: options.is_gm,
    game: options.game
  }, function(err, firm){
    firm.initState();

    cb(err, firm);
  });
}

router.post('/firm/new', function(req, res, next){
  if(req.body.new_game){
    Game.create({name: req.body.game}, function(err, game){
      createFirm({
        name: req.body.firm_name,
        is_gm: false,
        game: game._id
      }, function(err, firm){
        res.redirect('/game/' + req.body.game + "/" + firm._id)
      });
    });
  }else{
    Game.findOne({name: req.body.game}, function(err, game){
      createFirm({
        name: req.body.firm_name,
        is_gm: false,
        game: game._id
      }, function(err, firm){
        res.redirect('/game/' + req.body.game + "/" + firm._id)
      });
    });
  }
});

router.get('/game/:game_name/firms', async function(req, res, next){
  /*Game.findOne({name: req.params.game_name}, async function(err, game){
    var firms = await game.calculateFirmStates();
    res.send(firms);
  });*/

  var game = await Game.findOne({name: req.params.game_name});
  //var firms = await Firm.find({game: game._id});

  var firms = await Firm.aggregate([{
      $match: {
          game: game._id
      }
    }, {
        $lookup: {
            from: 'firmstates',
            localField: '_id',
            foreignField: 'firm',
            as: 'state'
        }
    }, {
        $unwind: {
            path: '$state'
        }
    }, {
        $sort: {
            "state.turn": -1
        }
    }, {
        $group: {
            _id: "$_id",
            name: {$first: "$name"},
            state: {$first: "$state"}
        }
    }]);

  res.send({
    firms: firms
  }); 
});

router.get('/game/:game_name/:firm_id', function(req, res, next){
  Game.findOne({name: req.params.game_name}, function(err, game){
    Firm.findOne({_id: req.params.firm_id}, function(err, firm){
      res.render("player_dash.html", {
        game: game,
        firm: firm
      });
    });
  });
});


router.get('/firm/:firm_id/state', function(req, res, next){
  FirmState.find({firm: req.params.firm_id}).sort({turn: 1}).exec(function(err, docs){
    res.send(docs);
  });
});

router.post('/firm/:firm_id/update', async function(req, res, next){
  var firm = await Firm.findOne({_id: req.params.firm_id}).populate("game");
  var state = await FirmState.find({firm: req.params.firm_id}).sort({turn: -1}).limit(1);

  var order = new UpdateOrder({
    firm: req.params.firm_id,
    budget_marketing: req.body.budget_marketing,
    budget_research: req.body.budget_research,
    productive_capacity: req.body.productive_capacity,
    unit_price: req.body.unit_price,
    turn: state.length != 0 ? state[0].turn : 0
  });

  var sentOrder = await order.save();
  //var firms = await firm.game.calculateFirmStates();

  res.send({
    order: sentOrder,
    state: state
  });
});

router.post("/gm/:game_name/run", async function(req, res, next){
  var game = await Game.findOne({name: req.params.game_name});
  res.send(await game.calculateFirmStates());
});

module.exports = router;