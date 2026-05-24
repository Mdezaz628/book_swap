import multer from "multer";

const {
  CloudinaryStorage
} = await import("multer-storage-cloudinary");

import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({

  cloudinary: cloudinary,

  params: {

    folder: "bookswap",

    allowedFormats: [
  "jpg",
  "png",
  "jpeg"
],

  },

});

const upload = multer({
  storage
});

export default upload;