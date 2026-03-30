const sendEmail = require('./utils/sendEmail');
const dotenv = require('dotenv');
dotenv.config();

sendEmail({
  email: process.env.SMTP_USER, // Send to themselves
  subject: 'NOC Portal Test Email',
  message: 'Testing nodemailer configuration.'
}).then(() => {
    console.log('Test Email Sent Successfully!');
    process.exit(0);
}).catch(err => {
    console.error('Test Email Failed:', err);
    process.exit(1);
});
