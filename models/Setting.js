const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({

    officeMode: {
        type: Boolean,
        default: false
    },
    userMarkup: {
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
},

updatedBy:String,

updatedAt:Date
});


module.exports =
mongoose.models.Setting ||
mongoose.model(
    'Setting',
    settingSchema
);