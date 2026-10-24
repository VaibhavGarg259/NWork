// import multer from "multer";

// const storage = multer.memoryStorage(); // store file in memory as buffer

// const upload = multer({ storage });
import multer from "multer";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default upload;
