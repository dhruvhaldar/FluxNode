const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoute = require('./routes/auth');
const projectsRoute = require('./routes/projects');
const jobsRoute = require('./routes/jobs');

// Serve static output files
const path = require('path');
app.use('/outputs', express.static(path.join(__dirname, '../outputs')));

app.use('/api/auth', authRoute);
app.use('/api/projects', projectsRoute);
app.use('/api/jobs', jobsRoute);

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fluxnode';
mongoose.connect(MONGO_URI)
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.log('MongoDB connection error:', err));

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
