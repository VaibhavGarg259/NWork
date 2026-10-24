import multer from "multer";
import path from "path";
import fs from "fs";

const dir = "uploads/profiles";
fs.mkdirSync(dir, { recursive: true });

const profileUpload = multer({
  storage: multer.diskStorage({
    destination: dir,
    filename: (req, file, cb) =>
      cb(
        null,
        `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`,
      ),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only JPG, PNG or WebP allowed")),
});

export default profileUpload;
