var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var FirmState = require('./firm_state');

var firmSchema = new mongoose.Schema({
    name: String,
    game: {type: ObjectId, ref: "Game", index: true},

    //Marks which "Firm" is running the game, they get a differnt display and have no states
    is_gm: Boolean
});

firmSchema.methods.initState = function(cb){
    //Make an initial state for this firm
    FirmState.create({
        firm: this._id,
        turn: 0,
        total_sales: 0,
        unit_price: 10,
        unit_cost: 10,
        inventory: 1000,
        max_productive_rate: 1000,
        market_share: 0,
        budget_marketing: 50,
        budget_research: 50,
        productive_capacity: 10,
        total_funds: 10000,
        attractiveness: 0
    }, function(err, state){
        if(cb){
            cb(err, state);
        }
    });
};

module.exports = mongoose.model("Firm", firmSchema);