const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a transporter using standard SMTP or placeholder fake transporter for now
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_USER || 'placeholder_user',
      pass: process.env.SMTP_PASSWORD || 'placeholder_pass',
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || 'NOC Portal <noreply@rgipt.ac.in>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${options.email}`);
  } catch (error) {
    console.error('Email sending failed: ', error);
  }
};

module.exports = sendEmail;
