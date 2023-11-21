import fs from "fs";
import util from "util"
const readFile = util.promisify(fs.readFile);
const ts = new Date().getTime();

import AWS from "aws-sdk";

const ddb = new AWS.DynamoDB({
    apiVersion: '2012-08-10',
    region: 'ap-southeast-1'
});
const ses = new AWS.SES({
    apiVersion: '2010-12-01',
    region: 'ap-southeast-1'
});

async function getItemRecent(user_email) { 
    let params = {
        TableName: "pwd-otp",
        KeyConditionExpression: "user_email = :user_email",
        ExpressionAttributeValues: {
            ":user_email": { S: `${user_email}` }
        }
    };

    try {
        let result = await ddb.query(params).promise();
        //console.log("getItem", result)
        return result.Items;
    } catch (error) {
        console.log("Error retrieving item from DynamoDB: ", error);
    }

    return false;
}

async function putItem(user_email, message, expiry) {
    let params = {
        TableName: 'pwd-otp',
        Item: {
            "user_email": { S: `${user_email}` },
            "message": { S: `${message}` },
            "expiry": { S: `${expiry}` }
        }
    };

    // Call DynamoDB to add the item to the 
    try {
        await ddb.putItem(params).promise();
        return true;
    } catch (error) {
        console.log("Error put to DynamoDB: ", error);
    }

    return false;
}

async function sendEmail(user_email, secret, min) {
    let params = {
        Destination: {
          ToAddresses: [user_email]
        },
        Message: { 
          Body: { 
            Html: {
             Charset: "UTF-8",
             Data: "Your One-Time Password (OTP) for Login is "+secret+". This code is valid for "+min+" mins. If you did not make this request, you may ignore this email. Please do not reply to this email."
            },
            Text: {
             Charset: "UTF-8",
             Data: "Your One-Time Password (OTP) for Login is "+secret+". This code is valid for "+min+" mins. If you did not make this request, you may ignore this email. Please do not reply to this email."
            }
           },
           Subject: {
            Charset: 'UTF-8',
            Data: "LOGIN OTP IS "+secret
           }
          },
        Source: 'otp@whyys.xyz'
    };

    try {
        await ses.sendEmail(params).promise();
        return true;
    } catch (error) {
        console.log("Error trigger SES: ", error);
    }

    return false;
}

export const handler = async (event) => {

    console.log(event)

    let otp_allowed = false;
    let secret = '000000';
    let expiry = ts;
    let e = false;
    
    let body = JSON.parse(event.body);
    console.log(body)

    if (body && body.action && body.action.toLowerCase() == 'request') {
        // Validate if email domain is allowed
        let domain_list = await readFile("my-domains.json","utf8");
        let domain_array = domain_list.split(/\r?\n/);
        for(var i=0; i<domain_array.length; i++){
            if (body.email.toLowerCase().indexOf(domain_array[i]) >= 0) {
                otp_allowed = true;
            }
        }

        // Generate 6D OTP save into DDB
        const min = 6;
        if (otp_allowed){
            secret = Math.floor(100000 + Math.random() * 900000);
            expiry = ts + ( 60000 * min)

            await putItem(body.email, secret, expiry)
        }

        // Send Email
        e = await sendEmail(body.email, secret, min)
    }
    else if (body && body.action && body.action.toLowerCase() == 'verify') {
        let res = await getItemRecent(body.email);
        console.log('result', res)
        if (res) {
            console.log(res[0].message.S, res[0].expiry.S, ts)

            if (body && body.otp && body.otp == res[0].message.S) {
                e = true;
                otp_allowed = true;
            }
        }
    }
    

    const response = {
        statusCode: 200,
        body: {
            "action": (body && body.action) ? body.action : '',
            "otp": otp_allowed,
            "email": (e) ? body.email : '',
            "expire": new Date(expiry).toLocaleString('en-US', {timeZone: 'Asia/Singapore'})
        }
    };
    return response;

  };
  