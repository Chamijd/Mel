const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
const path = require('path');

// Firebase Admin SDK - Replace with your own Firebase admin json file path
const serviceAccount = require('./serviceAccountKey.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ransikachamindu43@gmail.com',
    pass: 'xzxg yiry fafh dmfv'
'  // Use App Password for Gmail 2FA accounts
  }
});

app.post('/send-otp', async (req, res) => {
  const { email, uid } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await db.collection('users').doc(uid).set({
      email,
      otp,
      verified: false,
      otpTimestamp: Date.now()
    }, { merge: true });

    await transporter.sendMail({
      from: '"Darkcybercrew" <YOUR_GMAIL@gmail.com>',
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}`
    });

    res.json({ success: true, message: 'OTP sent' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Error sending OTP' });
  }
});

app.post('/verify-otp', async (req, res) => {
  const { uid, otp } = req.body;
  try {
    const doc = await db.collection('users').doc(uid).get();
    if (!doc.exists) return res.json({ success: false, message: 'User not found' });

    const data = doc.data();
    if (data.otp === otp && (Date.now() - data.otpTimestamp) < 5 * 60 * 1000) {
      await db.collection('users').doc(uid).update({ verified: true });
      res.json({ success: true, message: 'Verified!' });
    } else {
      res.json({ success: false, message: 'Invalid or expired OTP' });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
