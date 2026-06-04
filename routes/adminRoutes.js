const express = require('express');

const router = express.Router();

const bcrypt = require('bcrypt');
const ExcelJS =require('exceljs');
const User = require('../models/User');

const Flight = require('../models/Flight');

const Booking = require('../models/Booking');

const Transaction = require('../models/Transaction');

const {requireAdmin} = require('../middleware/auth');
const Setting = require('../models/Setting');
const sendMail =require('../utils/mailer');
const Markup = require('../models/Markup');
const Payment = require('../models/Payment');

// ================= DASHBOARD =================

router.get('/dashboard', requireAdmin, async (req, res) => {

    try {

        const totalUsers =
        await User.countDocuments({
            role: 'user'
        });

        const totalAgents =
        await User.countDocuments({
            role: 'agent'
        });

        const totalBookings =
        await Booking.countDocuments();

        const revenueData =
        await Booking.aggregate([
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: '$amount'
                    }
                }
            }
        ]);

        const totalRevenue =
        revenueData[0]?.total || 0;

        const walletData =
        await Transaction.aggregate([
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: '$amount'
                    }
                }
            }
        ]);

        const wallet =
        walletData[0]?.total || 0;

        res.json({

            success: true,

            totalUsers,
            totalAgents,
            totalBookings,
            totalRevenue,
            wallet

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            error: 'Dashboard failed ❌'

        });

    }

});



// ================= EXPORT LEDGER =================
router.get(
'/export-ledger',
requireAdmin,
async(req,res)=>{

const workbook =
new ExcelJS.Workbook();

const sheet =
workbook.addWorksheet(
'Ledger'
);

sheet.columns = [

{
header:'User',
key:'user'
},

{
header:'Amount',
key:'amount'
},

{
header:'Type',
key:'type'
}

];

const txns =
await Transaction.find()
.populate('userId');

txns.forEach(t=>{

sheet.addRow({

user:
t.userId?.email,

amount:
t.amount,

type:
t.type

});

});

res.setHeader(

'Content-Type',

'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

);

res.setHeader(

'Content-Disposition',

'attachment; filename=ledger.xlsx'

);

await workbook.xlsx.write(res);

res.end();

    });
// ================= UPDATE FLIGHT =================
router.put(
'/update-flight/:id',
requireAdmin,
async(req,res)=>{

try{

const flight =
await Flight.findByIdAndUpdate(

req.params.id,

req.body,

{new:true}

);

res.json({
success:true,
flight
});

}catch(err){

res.status(500).json({
error:'Update Failed'
});

}

});


// ================= GET MARKUP =================
router.get('/markup', requireAdmin, async(req,res)=>{

    let markup = await Markup.findOne();

    if(!markup){

        markup = await Markup.create({
            userMarkup:400,
            agentMarkup:100,
            adminMarkup:0
        });

    }

    res.json(markup);

});


// ================= USERS =================

router.get('/users', requireAdmin, async (req, res) => {

    try {

        const users =

            await User.find();

        res.json(users);

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            error: 'Users load failed ❌'

        });

    }

});

// ================= PAYMENT HISTORY =================
router.get(
'/payment-history',
requireAdmin,
async(req,res)=>{

try{

const payments =
await Payment.find()
.populate('userId')
.sort({createdAt:-1});

res.json(payments);

}catch(err){

console.log(err);

res.status(500).json({

error:'Load Failed'

});

}

    });

// ================= PHONEPE CALLBACK ================
router.get(
'/daily-report',
requireAdmin,
async(req,res)=>{

const report =
await Transaction.aggregate([

{
$match:{
type:'CREDIT'
}
},

{
$group:{
_id:null,

total:{
$sum:'$amount'
}
}
}

]);

res.json(report);

});

// ================= PENDING AGENTS =================
router.get('/pending-users', requireAdmin, async (req,res)=>{

    try{

        const users = await User.find({
            status: 'pending'
        });

        res.json(users);

    }catch(err){

        res.status(500).json({
            error:'Failed'
        });

    }

});

// ================= APPROVE USER =================

router.post('/approve/:id', requireAdmin, async (req, res) => {

    try {

        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                status: 'approved'
            },
            {
                returnDocument: 'after'
            }
        );

        // SEND WELCOME EMAIL
        await sendMail(

            user.email,

            'Welcome To Thakkar Travels',

            `
            <h2>Welcome To Thakkar Travels Group</h2>

            <p>Dear ${user.companyName || user.name},</p>

            <p>Your registration has been approved successfully.</p>

            <hr>

            <h3>Login Details</h3>

            User ID : ${user.email}<br>
            Role : ${user.role}<br>

            <br>

            <a href="http://localhost:3000/login.html">
                Login Now
            </a>

            <br><br>

            Regards,<br>
            Thakkar Travels
            `
        );

        res.json({

            success: true,

            message: 'User Approved Successfully'

        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            error: 'Approval Failed'

        });

    }

});

// ================= APPROVE USER (FOR AGENTS) =================
router.post('/approve-user/:id',async(req,res)=>{

try{

await User.findByIdAndUpdate(

req.params.id,

{
status:'approved'
}

);

res.json({

success:true

});

}catch(err){

res.status(500).json({

success:false

});

}

});

// ================= REJECT USER =================

router.post('/reject/:id', requireAdmin, async (req, res) => {

    try {

        await User.findByIdAndDelete(

            req.params.id

        );

        res.json({

            success: true,

            message: 'User rejected ❌'

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            error: 'Reject failed ❌'

        });

    }

});


// ================= RESET PASSWORD =================

router.post('/reset-password', requireAdmin, async (req, res) => {

    try {

        const hashed =

            await bcrypt.hash(

                req.body.password,

                10

            );

        await User.findOneAndUpdate(

            {

                email: req.body.email

            },

            {

                password: hashed

            }

        );

        res.json({

            success: true,

            message: 'Password reset ✅'

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            error: 'Reset failed ❌'

        });

    }

});


// ================= ADD FLIGHT =================

router.post('/add-flight', requireAdmin, async (req, res) => {

    try {

        const flight = await Flight.create({

            airline:

                req.body.airline,

            flightNo:

                req.body.flightNo,

            origin:

                req.body.origin.toUpperCase(),

            destination:

                req.body.destination.toUpperCase(),

            departure:

                req.body.departure,

            arrival:

                req.body.arrival,

            baseFare:

                Number(req.body.baseFare),

            seats:

                Number(req.body.seats),

            date:

                req.body.date,

            airlinePnr:

                req.body.airlinePnr || ''

        });

        res.json({

            success: true,

            message: 'Flight added ✈️',

            flight

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            error: 'Flight add failed ❌'

        });

    }

});

router.post('/office-mode', requireAdmin, async (req, res) => {

    let setting = await Setting.findOne();

    if (!setting) {

        setting = await Setting.create({
            officeMode: false
        });

    }

    setting.officeMode = req.body.officeMode;

    await setting.save();

    res.json({
        success: true
    });

});
// ================= GET FLIGHTS =================

router.get('/flights', requireAdmin, async (req, res) => {

    try {

        const flights =

            await Flight.find();

        res.json(flights);

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            error: 'Flights load failed ❌'

        });

    }

});
// ================= DELETE FLIGHT =================
router.delete(
'/delete-flight/:id',
requireAdmin,
async(req,res)=>{

try{

    await Flight.findByIdAndDelete(
        req.params.id
    );

    res.json({

        success:true,

        message:
        'Flight Deleted ✅'

    });

}catch(err){

    console.log(err);

    res.status(500).json({

        error:
        'Delete Failed ❌'

    });

}

});
router.get('/pending-bookings', requireAdmin, async (req, res) => {

    const bookings = await Booking.find({

        status: 'PENDING'

    }).sort({

        createdAt: -1

    });

    
res.json(bookings);

});

router.post(
'/approve-booking/:id',
requireAdmin,
async(req,res)=>{

    const booking =
    await Booking.findById(
        req.params.id
    );

    if(!booking){

        return res.json({
            error:
            'Booking not found'
        });

    }

    booking.status =
    'CONFIRMED';

    await booking.save();

    res.json({

        success:true,

        message:
        'Booking Approved ✅'

    });

});
// ================= GET PENDING USERS =================
router.get('/pending-users', requireAdmin, async (req,res)=>{

    const users = await User.find({

        status:'pending'

    });

    res.json(users);

});
// ================= OFFICE MODE =================

router.get(
'/office-mode',
requireAdmin,
async (req,res)=>{

    let setting =
    await Setting.findOne();

    if(!setting){

        setting =
        await Setting.create({
            officeMode:false
        });

    }

    res.json({
        officeMode:
        setting.officeMode
    });

    });
    // ================= GET MARKUP =================
router.get('/markup', requireAdmin, async(req,res)=>{

    let markup = await Markup.findOne();

    if(!markup){

        markup = await Markup.create({
            userMarkup:400,
            agentMarkup:100,
            adminMarkup:0
        });

    }

    res.json(markup);

});
// ================= GET LEDGER =================
router.get('/ledger', requireAdmin, async (req, res) => {

    try {

        const transactions = await Transaction
            .find()
            .populate('userId')
            .sort({ createdAt: -1 });

        res.json(transactions);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            error: 'Ledger load failed'
        });

    }

});



// ================= UPDATE MARKUP =================
router.post('/update-markup',requireAdmin,
    async (req, res) =>{
        try {

let setting =
        await Setting.findOne();

        if(!setting){

            setting =new Setting();
        }

        setting.userMarkup =Number(req.body.userMarkup);

        setting.agentMarkup =Number(req.body.agentMarkup);

        setting.adminMarkup =Number(req.body.adminMarkup);

        setting.updatedBy =
        req.session.user.id;

        setting.updatedAt =
        new Date();

            await setting.save();
             console.log("UPDATED MARKUP:", setting);


        res.json({

            success:true,

            updatedBy:'Admin',

            message:
            'Markup Updated Successfully'

        });

    }catch(err){

        console.log(err);

        res.json({

            success:false

        });

    }

});
module.exports = router;