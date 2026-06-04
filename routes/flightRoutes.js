const express = require('express');
const router = express.Router();
const Flight = require('../models/Flight');

// ================== GET FLIGHTS ==================
router.get('/', async (req, res) => {
    try {
        const { origin, destination, departuredate } = req.query;

        const flights = await Flight.find({
            origin: origin?.toUpperCase(),
            destination: destination?.toUpperCase(),
            date: departuredate   // ✅ ADD THIS
        });

        res.json(flights);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to fetch flights" });
    }
});

// ================== ADD FLIGHT (ADMIN/TEST) ==================
router.get('/add-demo', async (req, res) => {
    try {
        const flight = await Flight.create({
            airline: "IndiGo",
            flightNo: "6E 2044",
            origin: "DEL",
            destination: "SXR",
            departure: "07:40",
            arrival: "09:05",
            baseFare: 4999,
            seats: 10
        });

        res.json({ message: "Flight added ✅", flight });

    } catch (err) {
        res.status(500).json({ error: "Failed to add flight" });
    }
});

module.exports = router;