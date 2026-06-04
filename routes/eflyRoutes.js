const express = require('express');

const router = express.Router();

const {

     searchDestinations,
    searchDates
} = require('../services/eflyService');

router.get('/search', async (req, res) => {

    try {

        const {

            origin,
            destination,
            airline

        } = req.query;

        const data =
            await searchDates(

                origin,
                destination,
                airline

            );

        res.json(data);

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            error: err.message

        });

    }

});

router.get('/destinations', async (req, res) => {

    const data =
        await searchDestinations();

    res.json(data);

});

module.exports = router;