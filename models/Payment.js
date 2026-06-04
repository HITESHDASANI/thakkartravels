const mongoose = require('mongoose');

const paymentSchema =
new mongoose.Schema({

userId:{
type:mongoose.Schema.Types.ObjectId,
ref:'User'
},

txnId:String,

amount:Number,

credited:{
type:Boolean,
default:false
}

},{timestamps:true});

module.exports =
mongoose.model(
'Payment',
paymentSchema
);