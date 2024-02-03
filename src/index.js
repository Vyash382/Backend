
import connectDB from "./db/index.js";
import dotenv from 'dotenv'
import app from './app.js'
dotenv.config({
    path: './.env'
})
connectDB().then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`Server running on port ${process.env.PORT}`);
    })
}).catch((Error)=>{
    console.log(Error);
});


















/*
import express from 'express'
const app = express()
(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log(error);
            throw error
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App listeneing on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.log(error);  
    }
})()
*/