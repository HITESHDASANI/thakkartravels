const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    name: String,

    email: {

        type: String,

        unique: true

    },

    password: String,

    role: {

        type: String,

        enum: ['admin', 'agent', 'user'],

        default: 'user'

    },
    companyName: String,
contactNumber: String,
country: String,
address1: String,
address2: String,
city: String,
state: String,
pincode: String,

panName: String,
panNumber: String,

gstHolder: String,
gstNumber: String,
bankName: String,
accountHolder: String,
accountNumber: String,
ifscCode: String,

cancelledCheque: String,
agencyCertificate: String,
tradeLicense: String,
photo: String,
panFile: String,
gstFile: String,
addressProofFile: String,


    balance: {

        type: Number,

        default: 0

    },

    // EMAIL VERIFY

    verified: {

        type: Boolean,

        default: false

    },

    // REGISTER OTP

    otp: String,

    otpExpiry: Date,

    // LOGIN OTP

    loginCode: String,

    loginCodeExpiry: Date,

    // RESET PASSWORD

    resetOtp: String,

    resetOtpExpiry: Date,

    // ADMIN APPROVAL

    status: {

        type: String,

        enum: ['pending', 'approved'],

        default: 'pending'

    }
}, { timestamps: true });

module.exports =
mongoose.model('User', userSchema);