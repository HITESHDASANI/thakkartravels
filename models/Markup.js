const mongoose = require('mongoose');

const markupSchema = new mongoose.Schema({

    userMarkup:{
        type:Number,
        default:400
    },

    agentMarkup:{
        type:Number,
        default:100
    },

    adminMarkup:{
        type:Number,
        default:0
    }

});

module.exports = mongoose.model(
    'Markup',
    markupSchema
);