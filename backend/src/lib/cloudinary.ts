// src/lib/cloudinary.ts
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "fs/promises";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Define custom UploadResult type to include publicId
export interface UploadResult extends UploadApiResponse {
  publicId: string;
}

export const uploadOnCloudinary = async (
  filePath: string,
  options: { resource_type?: "auto" | "raw" | "image" | "video"; folder?: string; upload_preset?: string } = { resource_type: "auto", folder: "ecommerce-products" }
): Promise<UploadResult | null> => {
  try {
    // Validate file extension as a fallback (preset already restricts formats)
    const extension = path.extname(filePath).toLowerCase();
    const allowedFormats = ['.mp4', '.pdf', '.zip', '.mp3'];
    if (options.resource_type === "raw" || options.resource_type === "video" || options.resource_type === "auto") {
      if (!allowedFormats.includes(extension) && !options.upload_preset?.includes("product_images")) {
        throw new Error(`Unsupported file format: ${extension}. Allowed formats: ${allowedFormats.join(', ')}`);
      }
    }

    const folder = options.resource_type === "raw" || options.resource_type === "video" ? "digital-files" : "ecommerce-products";
    const uploadType = options.folder === "digital-files" ? "authenticated" : "upload";

    const result = await cloudinary.uploader.upload(filePath, {
      folder: options.folder || folder,
      resource_type: options.resource_type,
      type: uploadType,
      upload_preset: options.upload_preset,
    });

    console.log(
      `Uploaded file to Cloudinary: publicId=${result.public_id}, secure_url=${result.secure_url}, access_mode=${result.access_mode || "not specified"}`
    );

    const normalizedPath = path.normalize(filePath);
    try {
      await fs.unlink(normalizedPath);
      console.log(`Deleted temp file: ${normalizedPath}`);
    } catch (deleteErr) {
      console.warn(`Failed to delete temp file ${normalizedPath}:`, deleteErr);
    }

    // Store full publicId (with extension) for DigitalFile model
    return {
      ...result,
      publicId: result.public_id, // Keep full publicId including extension
    };
  } catch (err) {
    console.error("Cloudinary upload error:", err);

    const normalizedPath = path.normalize(filePath);
    try {
      await fs.unlink(normalizedPath);
      console.log(`Deleted temp file: ${normalizedPath}`);
    } catch (deleteErr) {
      console.warn(`Failed to delete temp file ${normalizedPath}:`, deleteErr);
    }

    throw new Error(`Failed to upload file to Cloudinary: ${err}`);
  }
};

export async function deleteFromCloudinary(publicId: string, resourceType: "image" | "raw" | "video" = "image"): Promise<void> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

    if (result.result === "ok" || result.result === "not found") {
      console.log(`Deleted or already absent Cloudinary asset: public_id=${publicId}, resource_type=${resourceType}`);
    } else {
      console.error(
        `Failed to delete Cloudinary asset: public_id=${publicId}, resource_type=${result.result}`
      );
      throw new Error(`Failed to delete Cloudinary asset: ${publicId}`);
    }
  } catch (err) {
    console.error(`Error deleting Cloudinary asset: public_id=${publicId}, resource_type=${resourceType}:`, err);
    throw err;
  }
}

export const generateSignedDownloadUrl = (
  publicId: string,
  fileName: string,
  expiresInSeconds: number = 3600,
  watermarkText?: string
): string => {
  try {
    console.log(`Generating signed URL: input publicId=${publicId}, fileName=${fileName}`);

    const extension = path.extname(fileName).toLowerCase();
    const format = extension.slice(1); // e.g., 'zip', 'pdf', 'mp4', 'mp3'
    const isVideo = extension === '.mp4';
    const isPdf = extension === '.pdf';

    const timestamp = Math.floor(Date.now() / 1000);
    const expiresAt = timestamp + expiresInSeconds;

    // Determine resource type based on file extension
    let resourceType: 'image' | 'video' | 'raw' = 'raw';
    if (isVideo) resourceType = 'video';
    if (isPdf) resourceType = 'image';

    // Use the publicId as stored in the database (without appending extension)
    const fullPublicId = publicId; // Do not append extension
    console.log(`Using full publicId: ${fullPublicId}, resourceType: ${resourceType}`);

    // Apply watermark only for PDF or video if watermarkText is provided
    const transformation = watermarkText && (isVideo || isPdf) ? [
      {
        overlay: {
          font_family: "Arial",
          font_size: isVideo ? 30 : 20,
          text: watermarkText,
        },
        gravity: "south",
        y: 10,
      },
    ] : undefined;

    // Extend the options type to include transformation
    interface PrivateDownloadUrlOptions {
      resource_type?: 'image' | 'video' | 'raw';
      type?: 'upload' | 'authenticated';
      expires_at?: number;
      attachment?: boolean;
      transformation?: any; // Allow transformation as any to bypass TypeScript error
    }

    const options: PrivateDownloadUrlOptions = {
      resource_type: resourceType,
      type: 'authenticated',
      expires_at: expiresAt,
      attachment: true,
    };

    if (transformation) {
      options.transformation = transformation;
    }

    // Use private_download_url for all cases to ensure correct signing
    const signedUrl = cloudinary.utils.private_download_url(fullPublicId, format, options);

    console.log(`Generated signed URL: publicId=${fullPublicId}, fileName=${fileName}, url=${signedUrl}`);
    return signedUrl;
  } catch (err) {
    console.error(`Error generating signed URL: publicId=${publicId}, fileName=${fileName}, error=${err}`);
    throw new Error("Failed to generate signed download URL");
  }
};