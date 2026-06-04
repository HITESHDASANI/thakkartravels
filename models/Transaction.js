const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({

    userId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: 'User'

    },
    pnr: String,
    airlinePnr: String,
    type: String,

    amount: Number,

    balanceBefore: Number,

    balanceAfter: Number,

    remark: String,

    createdAt: {

        type: Date,

        default: Date.now

    }

});

module.exports = mongoose.model(

    'Transaction',

    transactionSchema

);