import express from "express";
import { getCurrentOrganization, updateCurrentOrganization } from "../controllers/organizations.js";
import { authenticate } from "../middlewares/auth.js";

const organizations_router = express.Router();

organizations_router.get("/current", authenticate, getCurrentOrganization);
organizations_router.put("/current", authenticate, updateCurrentOrganization);

export default organizations_router;
