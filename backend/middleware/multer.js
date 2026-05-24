import multer from "multer";

const {
  CloudinaryStorage
} = await import("multer-storage-cloudinary");

import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
  folder: "books",
  allowed_formats: ["jpg", "png", "jpeg", "webp"]
  }
});

const upload = multer({ storage });

export default upload;