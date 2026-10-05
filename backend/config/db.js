import mongoose from "mongoose";
import dns from "dns";

dns.setServers([
  "1.1.1.1",
  "8.8.8.8",
]);

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    console.log(
      "MongoDB URI found:",
      uri.replace(/\/\/.*?:.*?@/, "//***:***@"),
    );

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 10000,
    });

    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);

    throw error;
  }
};

export default connectDB;