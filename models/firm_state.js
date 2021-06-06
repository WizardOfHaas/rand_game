var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var firmStateSchema = new mongoose.Schema({
    //Info for indexing and linking to a game
    firm: {type: ObjectId, ref: "Firm", index: true},
    turn: Number,

    //Actual state model values
    total_sales: Number,
	unit_price: Number,
	unit_cost: Number,
	inventory: Number,
	max_productive_rate: Number,
	market_share: Number,

	//Allocation of budget for
	budget_marketing: Number, //Marketing
	budget_research: Number, //Research and development

	productive_capacity: Number, //"increase in productive capacity"
	
	total_funds: Number, //Funds available for next quarter

	//"Hidden values" used by the math model
	attractiveness: Number //Proportional to marketing/r&r/price
});

module.exports = mongoose.model("FirmState", firmStateSchema);