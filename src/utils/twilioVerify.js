import twilio from 'twilio';

const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

export const sendOTP = async (phoneNumber) => {
  return await client.verify.v2.services(serviceSid)
    .verifications
    .create({ to: phoneNumber, channel: 'sms' });
};

export const verifyOTP = async (phoneNumber, code) => {
  const check = await client.verify.v2.services(serviceSid)
    .verificationChecks
    .create({ to: phoneNumber, code: code });
  return check.status === 'approved';
};