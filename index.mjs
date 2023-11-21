import axios from "axios";
const ts = new Date().toLocaleString('en-US', {timeZone: 'Asia/Singapore'});

export const handler = async (event) => {

    console.log(event)
    
    let body = JSON.parse(event.body);
    console.log('body',body)
    console.log('body.email',body.email)

    const response = {
        statusCode: 200,
        body: {
            "time": ts
        }
    };
    return response;

  };
  