import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
cloudinary.config({ 
  cloud_name: process.env.CNAME, 
  api_key: process.env.CAPIK, 
  api_secret: process.env.CAPIS
});
const uploadOnCloudinary = async (localpath)=>{
    try {
        if(!localpath) return null;
        else{
            const response = await cloudinary.uploader.upload(localpath,{resource_type: 'auto'});
            console.log('file uploaded successfully',response.url);
            return response;
        }
    } catch (error) {
        fs.unlinkSync(localpath);
    }
   
}

export {uploadOnCloudinary};