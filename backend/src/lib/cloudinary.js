import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// console.log(cloudinary.config());

// cloudinary checking code =>
// const {
//   CLOUDINARY_CLOUD_NAME: cloud,
//   CLOUDINARY_API_KEY: key,
//   CLOUDINARY_API_SECRET: secret,
// } = process.env;

// const timestamp = Math.floor(Date.now() / 1000);
// const signature = cloudinary.utils.api_sign_request({ timestamp }, secret);

// const form = new FormData();
// form.append(
//   "file",
//   "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
// );
// form.append("api_key", key);
// form.append("timestamp", String(timestamp));
// form.append("signature", signature);

// const res = await fetch(
//   `https://api.cloudinary.com/v1_1/${cloud}/image/upload`,
//   {
//     method: "POST",
//     body: form,
//   },
// );
// console.log(res.status, await res.text());

const removeLocalFile = async (filePath) => {
  try {
    if (filePath) await fs.promises.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.log("Failed to remove temp file:", err.message);
    }
  }
};

const uploadOnCloudinary = async (localFilePath) => {
  if (!localFilePath) return null;
  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "image",
      folder: "profiles",
    });
    return response;
  } catch (error) {
    console.log("Cloudinary upload failed:", error.message);
    console.log("Cloudinary error:", error.http_code, error.message, error);
    return null;
  } finally {
    removeLocalFile(localFilePath); // runs on success and failure
  }
};

export { uploadOnCloudinary, removeLocalFile };
