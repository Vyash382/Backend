import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
cloudinary.config({ 
  cloud_name: process.env.CNAME, 
  api_key: process.env.CAPIK, 
  api_secret: process.env.CAPIS
});