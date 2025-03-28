import { Router } from "express";
import {
  saveDraft,
  getDraftDetails,
  listDraftsInFolder,
} from "../controllers/draftController.js";
import verifyIdToken from "../middlewares/verifyIdToken.js";
const router = Router();

router.post("/saveDraft", verifyIdToken, saveDraft);
router.post("/getListDrafts", verifyIdToken, listDraftsInFolder);
router.post("/getDraftDetails", verifyIdToken, getDraftDetails);

export default router;
