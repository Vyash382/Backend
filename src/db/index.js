import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const connectDB = async()=>{
    try {
       const connectionInstance = await mongoose.connect(`mongodb://localhost:27017/${DB_NAME}`);
       console.log(`MongoDB connected ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log(`MongoDB connection error ${error}`);
        process.exit(1);
    }
}
export default connectDB;