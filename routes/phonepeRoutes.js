const express = require('express');

const router = express.Router();

const axios = require('axios');

const sha256 = require('sha256');

const uniqid = require('uniqid');

const User = require('../models/User');
const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');
// ================= CONFIG =================

const MERCHANT_ID = "YOUR_MERCHANT_ID";

const SALT_KEY = "YOUR_SALT_KEY";

const SALT_INDEX = 1;

const FRONTEND_URL =

"https://www.thakkartravels.com";


// ================= CREATE PAYMENT =================

router.post('/pay', async(req,res)=>{

    try{

        const { amount, userId } = req.body;

        const merchantTransactionId =

        uniqid();

        const data = {

            merchantId: MERCHANT_ID,

            merchantTransactionId,

            merchantUserId: userId,

            amount: amount * 100,

            redirectUrl:

            `${FRONTEND_URL}/payment-success.html`,

            redirectMode: "POST",

            callbackUrl:

            `${FRONTEND_URL}/phonepe/status/${merchantTransactionId}`,

            mobileNumber: "9999999999",

            paymentInstrument: {

                type: "PAY_PAGE"

            }

        };
        // Save payment record in DB with credited=false
        await Payment.create({

    userId,

    txnId:merchantTransactionId,

    amount

});

        const payload =

        JSON.stringify(data);

        const payloadMain =

        Buffer.from(payload).toString('base64');

        const string =

        payloadMain +

        "/pg/v1/pay" +

        SALT_KEY;

        const sha256val =

        sha256(string);

        const checksum =

        sha256val +

        '###' +

        SALT_INDEX;

        const response = await axios.post(

            'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay',

            {

                request: payloadMain

            },

            {

                headers: {

                    accept: 'application/json',

                    'Content-Type': 'application/json',

                    'X-VERIFY': checksum

                }

            }

        );

        res.json({

            success:true,

            url:

            response.data.data.instrumentResponse.redirectInfo.url

        });

    }

    catch(err){

        console.log(err);

        res.status(500).json({

            success:false,

            error:"PhonePe payment failed"

        });

    }

});
// ================= CREDIT USER AFTER PAYMENT SUCCESS =================


// ================= CHECK STATUS =================

router.get('/status/:txnId', async(req,res)=>{

   try{

      const merchantTransactionId =
      req.params.txnId;

      // PhonePe API Call

      const response = await axios.get(
         `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantTransactionId}/merchant/${MERCHANT_ID}`
      );

      if(
         response.data.success &&
         response.data.code === "PAYMENT_SUCCESS"
      ){

         const payment =
         await Payment.findOne({
            txnId: merchantTransactionId
         });

         if(payment && !payment.credited){

            const user =
            await User.findById(
               payment.userId
            );

            user.balance += payment.amount;

            await user.save();

            payment.credited = true;

            await payment.save();

            await Transaction.create({

               userId:user._id,

               amount:payment.amount,

               type:'CREDIT',

               remark:'PhonePe Deposit'

            });

         }
      }

      res.json(response.data);

   }catch(err){

      console.log(err);

      res.status(500).json({
         success:false
      });

   }

});

module.exports = router;