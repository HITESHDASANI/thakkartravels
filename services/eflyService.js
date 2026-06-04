const axios = require('axios');

let token = null;

async function loginEfly() {

    try {

        const body = {

            email:
                process.env.EFLY_EMAIL,

            pwd:
                process.env.EFLY_PASSWORD,

            efly_api_key:
                process.env.EFLY_API_KEY

        };

        console.log("EFly Login Request Started");

        const response = await axios({

            method: 'post',

            url:
            'https://eflyapi.ease2fly.com/api/tp-api/login',

            headers: {

                'Content-Type':
                    'application/json'

            },

            data: body

        });

        if (
    response.data &&
    response.data.status &&
    response.data.result
) {

    token = response.data.result.token;

    console.log('Efly Login Success');

    return token;
}

        else {

            console.log(
                'Login Failed'
            );

        }

    }

    catch (err) {

        console.log(

            'LOGIN ERROR:',

            err.response?.data ||

            err.message

        );

    }

}
async function searchFlights(
    origin,
    destination,
    departuredate
) {

    try {

        // LOGIN AGAIN IF TOKEN EMPTY

        if (!token) {

            await loginEfly();

        }

        const url =
`https://eflyapi.ease2fly.com/api/tp-api/v2/search-flights?origin=${origin}&destination=${destination}&airline=&departuredate=${departuredate}&adults=1&child=0&infant=0&trip_type=ow`;

        console.log("EFLY URL:", url);

        const response = await axios.get(

            url,

            {

                headers: {

                    Authorization:
                        `Bearer ${token}`,

                    efly_api_key:
                        process.env.EFLY_API_KEY

                }

            }

        );

        console.log(
    "EFLY API SUCCESS"
);

        // SUCCESS CHECK

        if (
            response.data &&
            response.data.status === true &&
            response.data.result
        ) {

            return response.data.result;

        }

        return [];

    }

    catch (err) {

        console.log(

            'SEARCH FLIGHT ERROR:',

            err.response?.data ||

            err.message

        );

        return [];

    }

}

async function searchDestinations() {

    try {

        const response = await axios.get(

            'https://eflyapi.ease2fly.com/api/tp-api/search-destinations',

            {

                headers: {

                    Authorization:
                        `Bearer ${token}`,

                    efly_api_key:
                        process.env.EFLY_API_KEY

                }

            }

        );

        return response.data.result;

    }

    catch (err) {

        console.log(

            'DESTINATION ERROR:',

            err.response?.data ||

            err.message

        );

    }

}
async function searchDates(

    origin,
    destination,
    airline = ''

) {

    try {

        const response = await axios.get(

            `https://eflyapi.ease2fly.com/api/tp-api/search-dates?origin=${origin}&destination=${destination}&airline=${airline}`,

            {

                headers: {

                    Authorization:
                        `Bearer ${token}`,

                    efly_api_key:
                        process.env.EFLY_API_KEY

                }

            }

        );

        return response.data.result;

    }

    catch (err) {

        console.log(

            'SEARCH DATE ERROR:',

            err.response?.data ||

            err.message

        );

    }

}

module.exports = {

    loginEfly,
    searchDestinations,
    searchDates,
    searchFlights

};