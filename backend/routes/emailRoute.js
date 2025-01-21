import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config(); 

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user:process.env.EMAIL_USER, // Use environment variable
    pass:process.env.EMAIL_PASS, // Use environment variable
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP Configuration Error:", error);
  } else {
    console.log("SMTP Server is ready to take messages:", success);
  }
});

router.post("/send", (req, res) => {
  const { firstName, lastName, email, subject, message } = req.body;

  // Validate incoming data
  if (!firstName || !lastName || !email || !subject || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const mailOptions = {
    from: email,
    to: process.env.EMAIL_USER,
    subject: `Contact Form Submission: ${subject}`,
    text: `Name: ${firstName} ${lastName}\nEmail: ${email}\n\nMessage:\n${message}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
      return res.status(500).json({ message: "Failed to send email.", error: error.message });
    }
    res.status(200).json({ message: "Email sent successfully!" });
  });
});

export default router;