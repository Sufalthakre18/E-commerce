import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (path: string) => {
  try {
    const result = await cloudinary.uploader.upload(path, {
      folder: "ecommerce-products",
      resource_type: "auto",
    });
    await fs.unlink(path);
    return result;
  } catch (err) {
    console.error("Cloudinary upload error", err);
    try { await fs.unlink(path) } catch {}
    return null;
  }
};

export const deleteFromCloudinary = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Cloudinary delete result:", result);
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return null;
  }
};


