const express = require('express');
const dotenv = require("dotenv").config();
const cors = require('cors');
const colors = require('colors')
const morgan = require("morgan")
const helmet = require('helmet');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const preferencesRoutes = require('./routes/preferencesRoutes');
const profileRoutes = require('./routes/profileRoutes');
const subscriptionRoutes = require("./routes/subscriptionRoutes")
const analyticsRoutes = require("./routes/analyticsRoutes");
const adminRoutes = require('./routes/adminRoutes')


const app = express();

connectDB()


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet());
app.use(morgan('dev'));


// Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/api/', (_req, res) => {
  res.json({ ok: true, message: 'SwiftUI Task API — core for anyone to keep track of their task' });
});


// Error handling middleware
app.use(notFound);
app.use(errorHandler);


const PORT = process.env.PORT || 5060;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`.cyan);
});