import multer from "multer";
import path from "path";
import fs from "fs";

const tempPath = "./public/temp";
if (!fs.existsSync(tempPath)) {
  fs.mkdirSync(tempPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log(`File uploaded: ${file.originalname}, MIME type: ${file.mimetype}, Field: ${file.fieldname}`);
  
  const allowedImageTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  const allowedDigitalTypes = ["application/pdf", "application/zip", "application/x-zip-compressed", "audio/mpeg", "application/octet-stream"];
  const allowedImageExtensions = [".png", ".jpg", ".jpeg", ".webp"];
  const allowedDigitalExtensions = [".pdf", ".zip", ".mp3"];
  const extension = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === "images" || file.fieldname === "variantImages") {
    if (allowedImageTypes.includes(file.mimetype) && allowedImageExtensions.includes(extension)) {
      cb(null, true);
    } else {
      console.error(`Invalid image type for ${file.originalname}: ${file.mimetype}`);
      cb(new Error("Invalid image type. Allowed: PNG, JPEG"));
    }
  } else if (file.fieldname === "digitalFiles") {
    if (allowedDigitalTypes.includes(file.mimetype) && allowedDigitalExtensions.includes(extension)) {
      cb(null, true);
    } else {
      console.error(`Invalid digital file type for ${file.originalname}: ${file.mimetype}`);
      cb(new Error("Invalid digital file type. Allowed: PDF, ZIP, MP3"));
    }
  } else {
    console.error(`Unknown field name for ${file.originalname}: ${file.fieldname}`);
    cb(new Error("Unknown field name"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 20MB max for all files
    files: 50, // Max 20 images + 10 digitalFiles for create, 20 images + 20 variantImages + 10 digitalFiles for update
  },
});