var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var Firm = require('./firm');
var FirmState = require('./firm_state');
var UpdateOrder = require('../models/update_order');

var gameSchema = new mongoose.Schema({
    name: String,
    firms: [{type: ObjectId, ref: "Firm", index: true}],
    turn: Number,
    phase: String
});

gameSchema.methods.calculateFirmStates = async function(cb){
    var self = this;

    /*
    Math model
    	Size of Market: N
    		RANDOM?
    
        Attractiveness:
    	a' = a[i] / sum(a) <-- Advertizing budget of team devided by sum of all budgets
    	r' = r[i] / sum(r) <-- Same normalized value, but for R&D budgets
    	p[i]		   <-- Just the price of the ith team's product
    	The actual math is some bullshit...
    	A[i] = c4 + e^(c1 * a' + c2 * r' - c3 * p[i])
    	...where constants are > 0, plus some unknown buffer constant c4 is added in...
    
        Market Share:
    	f[i] = A[i] / sum(A)
    
        Income:
    	R[i] = p[i] * f[i] * N
    	while f[i] * N <= q[i], where q is on-hand inventory
    
        Unit Cost:
    	u[i] = c5 + (c6 + c7 * M) / (1 + c8 * m) + max(c9 / (1 + c10 * r), c11) + c12 / M
    	where c is fucking something
    	M is the max rate of production
    	m is current rate of production
    	r is current R&D budget
    */

    var firms = await Firm.aggregate([{
        $match: {
            game: self._id
        }
    },{
        $lookup: {
            from: 'firmstates',
            localField: '_id',
            foreignField: 'firm',
            as: 'state'
        }
    }, {
        $lookup: {
            from: 'updateorders',
            localField: '_id',
            foreignField: 'firm',
            as: 'order'
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
            state: {$first: "$state"},
            order: {$first: "$order"}
        }
    }]);

    var totals = {
        budget_marketing: 0,
        budget_research: 0,
        unit_price: 0,
        attractiveness: 0
    };

    firms.forEach(function(firm){
        totals.budget_marketing += firm.state.budget_marketing;
        totals.budget_research += firm.state.budget_research;
        totals.unit_price += firm.state.unit_price;
    });
    
    firms = firms.map(function(firm){
        var state = firm.state;
        state._id = mongoose.Types.ObjectId();
        state.isNew = true;
        
        //I'll need to poll these from some update queue...
        state.budget_marketing = firm.order[0].budget_marketing;        
        state.budget_research = firm.order[0].budget_research;        
        state.productive_capacity = firm.order[0].productive_capacity;        
        state.unit_price = firm.order[0].unit_price;        

        UpdateOrder.deleteMany({firm: firm._id}, function(err){});

        var c = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
        var market_size = 10; //THIS IS RANDOM!
        
        state.attractiveness = c[4] + Math.exp(
            c[1] * state.budget_marketing / totals.budget_marketing + 
            c[2] * state.budget_research / totals.budget_research - 
            c[3] * state.unit_price / totals.unit_price
        );

        //state.market_share = 1; //Since it's just one player right now...
        
        state.total_sales = Math.floor(Math.min(state.inventory, state.market_share * market_size));
        state.inventory -= state.total_sales;
        
        state.total_funds -= state.budget_marketing;
        state.total_funds -= state.budget_research;
        
        state.unit_cost = c[5] + (c[6] + c[7] * state.max_productive_rate) / (1 + c[8] * state.productive_capacity) + 
          Math.max(c[9] / (1 + c[10] * state.budget_research), c[11]) + c[12] / state.max_productive_rate;
        
        state.total_funds += (state.unit_price - state.unit_cost) * state.total_sales;
        
        state.inventory += state.productive_capacity;
        
        state.turn++;
        

        firm.state = state;
        return firm;
    });

    firms.forEach(function(firm){
        totals.attractiveness += firm.state.attractiveness;
    });

    firms = firms.map(function(firm){
        firm.state.market_share = firm.state.attractiveness / totals.attractiveness;

        (new FirmState(firm.state)).save();

        return firm;
    });

    return firms;
}

module.exports = mongoose.model("Game", gameSchema);