import fs from "fs";
import util from "util"
const readFile = util.promisify(fs.readFile);
const ts = new Date().toLocaleString('en-US', {timeZone: 'Asia/Singapore'});

export const handler = async (event) => {

    console.log(event)
    
    let body = JSON.parse(event.body);
    console.log('body',body)
    console.log('body.email',body.email)

    let expiry = ts;

    // Validate if email domain is allowed
    let otp_allowed = false
    let domain_list = await readFile("my-domains.json","utf8");
    let domain_array = domain_list.split(/\r?\n/);
    for(var i=0; i<domain_array.length; i++){
        if (body.email.toLowerCase().indexOf(domain_array[i]) > 0) {
            otp_allowed = true;
        }
    }

    // Generate 6D OTP save into DDB

    // Send Email
    

    const response = {
        statusCode: 200,
        body: {
            "otp": otp_allowed,
            "email": body.email,
            "expire": expiry
        }
    };
    return response;

  };
  