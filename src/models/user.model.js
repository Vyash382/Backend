import mongoose from "mongoose";
import pkg from 'jsonwebtoken';
const { jwt } = pkg;
import bcrypt from 'bcrypt'
const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullname:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String, // cloudinary url
        required:true
    },
    coverImage:{
        type:String,
    },
    watchHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type:String,
        required:[]
    }
},{timestamps:true});
userSchema.pre("save",async function(next){
    if(!this.isModified("password")) next();
    this.password= await bcrypt.hash(this.password,10);
    next();
})
userSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password,this.password)
}
userSchema.methods.generateAccessToken = async function(){
   return jwt.sign({
        _id: this._id,
        email:this.email,
        username: this.username,
        fullname: this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
    )
}
userSchema.methods.generateRefreshToken = async function(){
    return jwt.sign({
         _id: this._id
     },
     process.env.REFRESH_TOKEN_SECRET,
     {
         expiresIn: process.env.REFRESH_TOKEN_EXPIRY
     }
     )
 }

export const User = mongoose.model("User",userSchema);