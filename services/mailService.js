const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({

    service: 'gmail',

    auth: {

        user: process.env.EMAIL_USER,

        pass: process.env.EMAIL_PASS

    }

});

async function sendMail(to, subject, html) {

    try {

        const info = await transporter.sendMail({

            from: process.env.EMAIL_USER,

            to,
            subject,
            html

        });

        console.log("EMAIL SENT ✅");

        return info;

    }

    catch (err) {

        console.log("EMAIL FAILED ❌");

        console.log(err);

        return false;

    }

}

module.exports = sendMail;