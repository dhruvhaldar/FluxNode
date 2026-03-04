const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res) => {
  try {
    const emailExist = await User.findOne({ email: req.body.email });
    if (emailExist) return res.status(400).json({ message: 'Email already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const user = new User({
      email: req.body.email,
      password: hashedPassword
    });

    const savedUser = await user.save();

    // Auto-login after registration
    const token = jwt.sign({ _id: savedUser._id }, process.env.JWT_SECRET || 'supersecretjwtkey');
    res.header('Authorization', `Bearer ${token}`).json({ token, user: { id: savedUser._id, email: savedUser.email } });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json({ message: 'Email is not found' });

    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) return res.status(400).json({ message: 'Invalid password' });

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET || 'supersecretjwtkey');
    res.header('Authorization', `Bearer ${token}`).json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get Me
const auth = require('../middleware/auth');
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
