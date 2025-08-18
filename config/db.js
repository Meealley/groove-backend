const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    const options = {
      // // Connection options
      // useNewUrlParser: true,
      // useUnifiedTopology: true,

      // Performance options
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      // bufferCommands: false, // Disable mongoose buffering
      // bufferMaxEntries: 0, // Disable mongoose buffering

      // // Authentication (if needed)
      // authSource: process.env.MONGO_AUTH_SOURCE || "admin",

      // SSL/TLS options (for production)
      // ssl: process.env.NODE_ENV === "production",
      // sslValidate: process.env.NODE_ENV === "production",

      // Replica set options (if using replica sets)
      readPreference: "secondaryPreferred",

      // Application name for monitoring
      appName: "TaskGroove",
    };

    const conn = await mongoose.connect(mongoURI, options);
    console.log(
      `MongoDB connected successfully: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`
        .italic.magenta
    );
    mongoose.set("strictQuery", true);

    return conn;
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
