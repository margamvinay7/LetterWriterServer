import { Router } from "express";
import {
  listFilesInFolder,
  saveLetter,
  getFileDetails,
  updateFile,
} from "../controllers/letterController.js";
import verifyIdToken from "../middlewares/verifyIdToken.js";
const router = Router();

router.post("/saveLetter", verifyIdToken, saveLetter);
router.post("/getListFiles", verifyIdToken, listFilesInFolder);
router.post("/getFileDetails", verifyIdToken, getFileDetails);

router.post("/updateFile", verifyIdToken, updateFile);
export default router;
