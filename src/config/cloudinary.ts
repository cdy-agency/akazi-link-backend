import dotenv from 'dotenv';

dotenv.config();

const cloudinary = ({
  cloudName: process.env.CLOUDINARY_NAME || '',
  apiKey: process.env.CLOUDINARY_KEY||'',
  apiSecret: process.env.CLOUDINARY_SECRET||"",
});

export default cloudinary;