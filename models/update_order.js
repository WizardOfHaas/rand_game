var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var updateOrderSchema = new mongoose.Schema({
    //Info for indexing and linking to a game
    firm: {type: ObjectId, ref: "Firm", index: true},
    turn: Number,
	unit_price: Number,
	budget_marketing: Number, //Marketing
	budget_research: Number, //Research and development
	productive_capacity: Number //"increase in productive capacity"
});

module.exports = mongoose.model("UpdateOrder", updateOrderSchema);