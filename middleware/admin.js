const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Flight = require('../models/Flight');

// ✅ GET all users
router.get('/users', async (req, res) => {
    const users = await User.find();
    res.json(users);
});

// ✅ Approve user
router.post('/approve/:id', async (req, res) => {
    await User.findByIdAndUpdate(req.params.id, { approved: true });
    res.send("User approved ✅");
});

// ✅ Reject user
router.post('/reject/:id', async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.send("User rejected ❌");
});

// ✅ Reset password
router.post('/reset-password', async (req, res) => {
    const bcrypt = require('bcrypt');
    const hashed = await bcrypt.hash(req.body.password, 10);

    await User.findOneAndUpdate(
        { email: req.body.email },
        { password: hashed }
    );

    res.send("Password reset ✅");
});

// ✅ Add manual flight
router.post('/add-flight', async (req, res) => {
    const flight = new Flight(req.body);
    await flight.save();
    res.send("Flight added ✈️");
});

// ✅ Get all flights
router.get('/flights', async (req, res) => {
    const flights = await Flight.find();
    res.json(flights);
});
module.exports = (req, res, next) => {

    // LOGIN CHECK

    if (!req.session.user) {

        return res.redirect('/login.html');

    }

    // ADMIN CHECK

    function requireAdmin(req,res,next){

    if(!req.session.user){

        return res.status(401).json({
            error:'Login required'
        });

    }

    if(
        req.session.user.role
        .toLowerCase() !== 'admin'
    ){

        return res.status(403).json({
            error:'Admin only'
        });

    }

    next();

}
};
async function loadPendingUsers(){

    const res =
    await fetch('/admin/pending-users');

    const users =
    await res.json();

    let html='';

    users.forEach(u=>{

        html += `

        <div>

            ${u.email}

            <button onclick="approve('${u._id}')">

                Approve

            </button>

        </div>

        `;

    });

    document.getElementById(
        'pendingUsers'
    ).innerHTML = html;

}

loadPendingUsers();
module.exports = router;