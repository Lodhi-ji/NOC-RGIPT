const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Route imports
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const officerRoutes = require('./routes/officerRoutes');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/officer', officerRoutes);

// Database connection
const connectDB = async () => {
  try {
    // Generate a test URI if none is provided in .env
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/noc_portal';
    await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
