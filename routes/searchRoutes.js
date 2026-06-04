const express = require('express');

const router = express.Router();

const axios = require('axios');

router.get('/search', async (req, res) => {

try {

    const {
        doj,
        from,
        to
    } = req.query;

    // ================= ROLE =================

    let role = 'user';

    if (

        req.session &&
        req.session.user

    ) {

        role =
        req.session.user.role;

    }

    console.log("ROLE:", role);

    // ================= MARKUP =================

    // ================= MARKUP =================

let markup = 0;

const setting = await Setting.findOne();

if(setting){

    if(role === 'user'){

        markup = Number(
            setting.userMarkup || 0
        );

    }

    if(role === 'agent'){

        markup = Number(
            setting.agentMarkup || 0
        );

    }

    if(role === 'admin'){

        markup = Number(
            setting.adminMarkup || 0
        );

    }

}

// APPLY MARKUP

finalResults = finalResults.map(f => ({

    ...f,

    fare:

    Number(f.fare || 0)

    + markup

}));

console.log("ROLE:",

req.session?.user?.role

);

console.log("MARKUP:", markup);

console.log("FINAL DATA:", finalResults);

    // ================= GOOGLE SHEET =================

    const response =
    await axios.get(

'https://script.google.com/macros/s/AKfycbw-0nNFmUVi9OBmqHmKvN2-3oRtMkuAk9K6wDe35djhSRQ-wHesRpCJzR3h057oVgyjMQ/exec'

    );

    let flights =
    response.data;

    // ================= FILTER =================

    flights = flights.filter(f => {

        return (

            f.doj == doj &&

            f.origin
            .toLowerCase() ==

            from.toLowerCase()

            &&

            f.destination
            .toLowerCase() ==

            to.toLowerCase()

        );

    });

    // ================= ADD MARKUP =================

    const finalResults =

    flights.map(f => ({

        ...f,

        fare:

        Number(f.fare)

        + markup

    }));

    console.log(finalResults);

    res.json(finalResults);

}

catch (err) {

    console.log(err);

    res.status(500).json({

        error:
        "Search failed ❌"

    });

}

});

module.exports = router;