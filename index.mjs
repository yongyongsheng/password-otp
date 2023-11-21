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

async function getItemRecent(chat_id, chat_time_now) { 
    let params = {
        TableName: "pwd-otp",
        KeyConditionExpression: "chat_id = :chat_id AND #chat_time > :chat_time",
        ExpressionAttributeNames: { "#chat_time": "chat_time" },
        ExpressionAttributeValues: {
            ":chat_id": { S: `${chat_id}` },
            ":chat_time": { N: `${chat_time}` }
        }
    };

    try {
        let result = await ddb.query(params).promise();
        //console.log("getItem", result)
        return result.Items;
    } catch (error) {
        console.log("Error retrieving item from DynamoDB: ", error);
    }
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

    return
}

async function sendEmail(user_email, secret) {
    let params = {
        Destination: {
          ToAddresses: [user_email]
        },
        Message: { 
          Body: { 
            Html: {
             Charset: "UTF-8",
             Data: "YOUR OTP IS "+secret
            },
            Text: {
             Charset: "UTF-8",
             Data: "YOUR OTP IS "+secret
            }
           },
           Subject: {
            Charset: 'UTF-8',
            Data: "YOUR OTP IS "+secret
           }
          },
        Source: 'go@whyys.xyz'
    };

    try {
        await ses.sendEmail(params).promise();
    } catch (error) {
        console.log("Error trigger SES: ", error);
    }
}

export const handler = async (event) => {

    console.log(event)
    
    let body = JSON.parse(event.body);
    console.log('body',body)
    console.log('body.email',body.email)
    console.log('body.email',body.email)

    // Validate if email domain is allowed
    let otp_allowed = false
    let domain_list = await readFile("my-domains.json","utf8");
    let domain_array = domain_list.split(/\r?\n/);
    for(var i=0; i<domain_array.length; i++){
        if (body.email.toLowerCase().indexOf(domain_array[i]) >= 0) {
            otp_allowed = true;
        }
    }

    // Generate 6D OTP save into DDB
    let secret = '000000';
    let expiry = ts;
    if (otp_allowed){
        secret = Math.floor(100000 + Math.random() * 900000);
        expiry = ts + 600000 //10 min

        await putItem(body.email, secret, expiry)
    }

    // Send Email
    let e = await sendEmail(body.email, secret)
    

    const response = {
        statusCode: 200,
        body: {
            "otp": otp_allowed,
            "email": body.email,
            "expire": new Date(expiry).toLocaleString('en-US', {timeZone: 'Asia/Singapore'}),
            "secret": secret
        }
    };
    return response;

  };
  