import express from "express";
import settings from "../systems/settings.js";

const router = express.Router();

router.use("/toggle-theme", settings.themeToggle);
router.use("/accept-cookies", settings.acceptCookies);
router.use("/decline-cookies", settings.declineCookies);
router.use("/manage-cookies", settings.manageCookies);

export default router;