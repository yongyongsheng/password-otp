import axios from "axios";
const ts = new Date().toLocaleString('en-US', {timeZone: 'Asia/Singapore'});

export const handler = async (event) => {

    console.log(event)

    const response = {
        statusCode: 200,
        body: {
            "time": ts
        }
    };
    return response;

  };
  