import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser= asyncHandler(async(req,res)=>{
    const {fullName, email, username , password} = req.body;
    
    if (fullName==="") {
        throw new ApiError(400,"full name is required")
    }
    if (email==="") {
        throw new ApiError(400,"email is required")
    }
    if (password==="") {
        throw new ApiError(400,"password is required")
    }
    if (username==="") {
        throw new ApiError(400,"username is required")
    }
    const existedUser= await User.findOne({
        $or: [{username},{email}]
    });
    if(existedUser) throw new ApiError(409,"User already exists");
    console.log(req.files);
    
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath  ;
    if((req.files && Array.isArray(req.files.coverImage)) && req.files.coverImage.length >0 ) 
     coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar1 file is required");
    }
   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);
   if(!avatar){
    throw new ApiError(400,"Avatar2 file is required");
   }
   const user = await User.create({
    fullname:fullName,
    avatar: avatar.url,
    coverImage: coverImage?coverImage.url || "":"" /*coverImage.url || ""*/,
    email,
    password,
    username: username.toLowerCase()
   });
   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
   )
   if(!createdUser){
        throw new ApiError(500, "Something Went Wrong while registeering a user");
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
})
export {registerUser};