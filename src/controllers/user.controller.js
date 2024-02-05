import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'
const generateAccessAndRefreshToken = async(userId)=>{
    try {
        
        
        const user = await User.findById(userId);
        // console.log(user);
        
        const accessToken = await user.generateAccessToken();
        const refreshToken =await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        return {refreshToken,accessToken};
    } catch (error) {
        throw new ApiError(500,"Cannot generate refresh and access token");
    }
}
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
});
const loginUser = asyncHandler(async(req,res)=>{
    //req body se data laao
    //username or email
    //find the user
    //password check
    //access and refresh token
    //send cookie
    // console.log(req.body);
    const {email,username,password}= req.body;
    
    if(!username && !email){
        throw new ApiError(400,"Username or email is required");
    }
    const user = await User.findOne({$or:[{username},{email}]});
    if(!user){
        throw new ApiError(400,"User dont exist");
    }
    // console.log(user);
    
    const isPasswordValid= await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(400,"Invalid user credentials");
    }
    const {refreshToken,accessToken}=await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password ") ;
    const options = {
        httpOnly: true,
        secure: true
    }
    // console.log(user.refreshToken);
    
    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
        new ApiResponse(200,{user:loggedInUser,accessToken,refreshToken},"User loggedin successfully")
    )
});
const logoutUser = asyncHandler(async(req,res)=>{
   await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
           
        },
        {
            new: true
        }

    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponse(200,{},"User Logged out"));
});
const refreshAccessToken = asyncHandler(async(req,res)=>{
  try {
    const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken) {
      throw new ApiError(401,"Unauthorised request");
    }
    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedToken._id);
    if(!user) throw new ApiError(401,"Invalid refresh token");
    if(incomingRefreshToken!==user.refreshToken) throw new ApiError(401,"Refresh token is expired or used");
    const options = {
      httpOnly:true,
      secure:true
    };
    const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id);
    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(new ApiResponse(200,{accessToken,refreshToken},"Refreshed Access token"));
  } catch (error) {
    throw new ApiError(401,"Something went wrong");
  }
});
const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body;
    const user = await User.findById(req.user?._id);
   const isPasswordCorrect= await user.isPasswordCorrect(oldPassword);
   if(!isPasswordCorrect) throw new ApiError(400,"Invalid Password");
   user.password = newPassword;
   await user.save({validateBeforeSave:false});
   return res.status(200).json(new ApiResponse(200,{},"Password Changed Successfully"));
});
const changeAvatar=asyncHandler(async(req,res)=>{
    const avatarLP = req.files?.avatar[0]?.path;
    if(!avatarLP) throw new ApiError(401,"Avatar not found");
    const url = await uploadOnCloudinary(avatarLP);
    const user = await User.findById(req.user?._id);
    user.avatar=url.url;
   await user.save({validateBeforeSave:false});
    res.status(200).json(new ApiResponse(200,{newAvatar:user.avatar},"Uploaded Successfully"));
});
const getUserChannelProfile = async(async(req,res)=>{
    const {username}=req.params;
    if(!username?.trim()){
        throw new ApiError(400,"username is missing");
    }
    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
            
        },
        {
            $lookup:{
                from: "subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField:"_id",
                foreignField:"subscribers",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount: {
                    $size:"$subscribers"
                },
                subscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if: {$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                subscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
    ])
    if(!channel?.length){
        throw new ApiError(404,"Channel does not exist");
    }
    return res.status(200).json(new ApiResponse(200,channel[0],"User channel fetched successfully"))
})
export {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,changeAvatar,getUserChannelProfile};