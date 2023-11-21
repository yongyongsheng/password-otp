# ONE TIME PASSWORD SERVICE

This function allow user to request for OTP sent via email and verify if the OTP is correct.

### AWS Services:
- Lambda
- DynamoDB
- SES

---

### API

**To request for OTP. Provide email address, OTP will be sent to requestor email.** \
POST 
```
{
    "action":"request",
    "email":"nunchukz@gmail.com"
}
```

**To verify OTP against email.** \
POST 
```
{
    "action":"verify",
    "email":"nunchukz@gmail.com",
    "otp": "474805"
}
```
