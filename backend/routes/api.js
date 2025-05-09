const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

router.post('/complain', async (req, res) => {
  const { name, phone, email, details } = req.body;
  if (!name || !phone || !email || !details) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Configure your SMTP transporter (use your real credentials in production)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your_gmail@gmail.com', // replace with your email
      pass: 'your_gmail_app_password' // replace with your app password
    }
  });

  const mailOptions = {
    from: 'your_gmail@gmail.com', // replace with your email
    to: 'badhon495@gmail.com',
    subject: 'New Complaint Received',
    text: `Name: ${name}\nPhone: ${phone}\nEmail: ${email}\nDetails: ${details}`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send email.' });
  }
});

module.exports = router;