const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');

const User =require('../models/User');



const sendMail = require('../utils/mailer');
const multer = require('multer');

const storage = multer.diskStorage({

    destination: function(req, file, cb){

        cb(null, 'uploads/');

    },

    filename: function(req, file, cb){

        cb(null, Date.now() + '-' + file.originalname);

    }

});

const upload = multer({ storage });
// ================= REGISTER =================
router.post(
    '/register',

    upload.fields([

        { name: 'panFile' },

        { name: 'gstFile' },

        { name: 'addressProofFile' },
        { name:'cancelledCheque' },
    { name:'agencyCertificate' },
    { name:'tradeLicense' },
    { name:'photo' }

    ]),

    async(req,res)=>{

    try {

        const {
            name,
            email,
            password,
            role
        } = req.body;

        const existing =
        await User.findOne({ email });

        if (existing) {

            return res.json({
                error:
                "Email already exists ❌"
            });

        }

        const hash =
        await bcrypt.hash(password, 10);

        const otp =
        Math.floor(
            100000 + Math.random() * 900000
        ).toString();
console.log(req.body);
        const user = await User.create({


            
    // LOGIN DETAILS
    name: req.body.companyName,
    email: req.body.email,
    password: hash,

    // ROLE
    role: (req.body.role || 'user').toLowerCase(),

    // OTP VERIFY
    verified: false,
    status: "pending",
    otp,
    otpExpiry: Date.now() + 30 * 60 * 1000,

    // COMPANY DETAILS
    companyName: req.body.companyName,
    contactNumber: req.body.contactNumber,
    country: req.body.country,
    address1: req.body.address1,
    address2: req.body.address2,
    city: req.body.city,
    state: req.body.state,
    pincode: req.body.pincode,

    // PAN
    panName: req.body.panName,
    panNumber: req.body.panNumber,

    // GST
    gstHolder: req.body.gstHolder,
    gstNumber: req.body.gstNumber,

    // FILES
    panFile:
        req.files?.panFile?.[0]?.filename || '',

    gstFile:
        req.files?.gstFile?.[0]?.filename || '',

    addressProofFile:
        req.files?.addressProofFile?.[0]?.filename || ''

});

        await sendMail(

            user.email,

            "Email Verification OTP",

            `Your OTP is ${otp}`

        );

        res.json({

            message:
            "OTP sent to email ✅"

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            error:
            "Register failed ❌"

        });

    }

});
// ================= REGISTER AGENT =================
router.post('/register-agent', async(req,res)=>{

try{

const {

    name,
    email,
    password

} = req.body;

const hash =
await bcrypt.hash(password,10);

const user =
await User.create({

    name,

    email,

    password:hash,

    role:'AGENT',

    approved:false,

    balance:0

});

await sendMail(

'thakkartravels.dasani@gmail.com',

'New Agent Registration Request',

`

New Agent Registration

Name : ${name}

Email : ${email}

`

);

res.json({

    success:true

});

}

catch(err){

console.log(err);

res.status(500).json({

success:false

});

}

});

// ================= VERIFY REGISTER OTP =================
router.post('/verify-otp', async (req, res) => {

    try {

        const {
            email,
            otp
        } = req.body;

        const user =
        await User.findOne({ email });

        if (!user) {

            return res.json({
                error:
                "User not found ❌"
            });

        }

        if (user.otp !== otp) {

            return res.json({
                error:
                "Invalid OTP ❌"
            });

        }

        if (
            user.otpExpiry &&
            user.otpExpiry < Date.now()
        ) {

            return res.json({
                error:
                "OTP expired ❌"
            });

        }

        user.verified = true;
user.otp = null;
user.otpExpiry = null;

await user.save();

await sendMail(

'thakkartravels.dasani@gmail.com',

'New Registration Request',

`

<h2>New Agent Registration</h2>

Name : ${user.companyName}<br>
Email : ${user.email}<br>
Mobile : ${user.contactNumber}<br>

<p>
Waiting for Approval
</p>

`

);

        res.json({

            message:
            "Email verified ✅"

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            error:
            "Verification failed ❌"

        });

    }await sendMail(

    'thakkartravels.dasani@gmail.com',

    'New User Registration Request',

    `
    <h2>New Registration Received</h2>

    <table border="1" cellpadding="8">

        <tr>
            <td>Name</td>
            <td>${user.name || ''}</td>
        </tr>

        <tr>
            <td>Email</td>
            <td>${user.email}</td>
        </tr>

        <tr>
            <td>Mobile</td>
            <td>${user.mobile || ''}</td>
        </tr>

        <tr>
            <td>Role</td>
            <td>${user.role}</td>
        </tr>

    </table>

    <br>

    <a href="http://localhost:3000/admin.html">
        Open Admin Panel
    </a>
    `
);

});
// ================= GET PENDING USERS =================
router.get('/pending-users', async (req,res)=>{

    try{

        const users = await User.find({
status:'pending'
})

        res.json(users);

    }

    catch(err){

        res.status(500).json({

            error:'Failed'

        });

    }

});

// ================= LOGIN =================
// ================= LOGIN =================
router.post('/login', async (req, res) => {

    try {

        const { email, password } = req.body;

        console.log("LOGIN REQUEST:", email);

        const user =
        await User.findOne({ email });

        if (!user) {

            return res.json({
                error: "User not found ❌"
            });

        }

        // APPROVAL CHECK
        if (
            user.status !== "approved" &&
            user.role !== "admin"
        ) {

            return res.json({
                error:
                "Waiting for admin approval ❌"
            });

        }

        // PASSWORD CHECK
        const match =
        await bcrypt.compare(
            password,
            user.password
        );

        if (!match) {

            return res.json({
                error:
                "Wrong password ❌"
            });

        }

        // GENERATE OTP
        const loginCode =
        Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        console.log("NEW OTP:", loginCode);

        // SAVE OTP
        user.loginCode = loginCode;

        user.loginCodeExpiry =
        Date.now() + 5 * 60 * 1000;

        await user.save();

        console.log("OTP SAVED");

        // SEND EMAIL
        await sendMail(

            user.email,

            "Login OTP",

            `Your OTP is ${loginCode}`

        );

        res.json({

            otpRequired: true,

            message:
            "OTP sent to email ✅"

        });

    }

    catch (err) {

        console.log("LOGIN ERROR:", err);

        res.status(500).json({

            error:
            "Login failed ❌"

        });

    }

});

// ================= VERIFY LOGIN CODE =================
// ================= VERIFY OTP =================
router.post('/verify-login-code', async (req, res) => {

    try {

        const { email, otp } = req.body;

        const user = await User.findOne({ email });

        if (!user) {

            return res.json({
                error: "User not found ❌"
            });

        }

        if (
            user.loginCode !== otp
        ) {

            return res.json({
                error: "Invalid OTP ❌"
            });

        }

        if (
            new Date(user.loginCodeExpiry) < new Date()
        ) {

            return res.json({
                error: "OTP expired ❌"
            });

        }

        // LOGIN SESSION
        req.session.user = {

            id: user._id,

            role: user.role

        };

        // CLEAR OTP
        user.loginCode = "";
        user.loginCodeExpiry = null;

        await user.save();

        res.json({

            success: true,

            role: user.role,

            message: "Login success ✅"

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            error:
                "OTP verify failed ❌"

        });

    }

});


// ================= CURRENT USER =================
router.get('/me', async (req, res) => {

    try {

        if (!req.session.user) {

            return res.status(401).json({
                error:
                "Login required ❌"
            });

        }

        const user =
        await User.findById(
            req.session.user.id
        );

        if (!user) {

            return res.status(404).json({
                error:
                "User not found ❌"
            });

        }

        res.json({

            id: user._id,

            name: user.name,

            email: user.email,

            role: user.role,

            balance:
            Number(user.balance || 0)

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            error:
            "Failed ❌"

        });

    }

});


// ================= FORGOT PASSWORD =================
router.post('/forgot-password',
async (req, res) => {

    try {

        const { email } = req.body;

        const user =
        await User.findOne({ email });

        if (!user) {

            return res.json({
                error:
                "User not found ❌"
            });

        }

        const otp =
        Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        user.resetOtp = otp;

        user.resetOtpExpiry =
        Date.now() + 5 * 60 * 1000;

        await user.save();

        await sendMail(

            user.email,

            "Reset Password OTP",

            `Your reset OTP is ${otp}`

        );

        res.json({

            message:
            "Reset OTP sent ✅"

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            error:
            "Forgot password failed ❌"

        });

    }

});


// ================= RESET PASSWORD =================
router.post('/reset-password',
async (req, res) => {

    try {

        const {
            email,
            otp,
            newPassword
        } = req.body;

        const user =
        await User.findOne({ email });

        if (!user) {

            return res.json({
                error:
                "User not found ❌"
            });

        }
        

        if (user.resetOtp !== otp) {

            return res.json({
                error:
                "Invalid OTP ❌"
            });

        }

        if (
            user.resetOtpExpiry &&
            user.resetOtpExpiry < Date.now()
        ) {

            return res.json({
                error:
                "OTP expired ❌"
            });

        }

        const hash =
        await bcrypt.hash(
            newPassword,
            10
        );

        user.password = hash;

        user.resetOtp = null;

        user.resetOtpExpiry = null;

        await user.save();

        res.json({

            message:
            "Password reset successful ✅"

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            error:
            "Reset failed ❌"

        });

    }

});


// ================= LOGOUT =================
router.get('/logout', (req, res) => {

    req.session.destroy(() => {

        res.json({

            message:
            "Logout success ✅"

        });

    });

});


module.exports = router;