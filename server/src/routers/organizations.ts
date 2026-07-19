import express from "express";
import { getCurrentOrganization, updateCurrentOrganization, deleteCurrentOrganization, createOrganization } from "../controllers/organizations.js";
import { authenticate } from "../middlewares/auth.js";

const organizations_router = express.Router();

organizations_router.post("/", authenticate, createOrganization);
organizations_router.get("/current", authenticate, getCurrentOrganization);
organizations_router.put("/current", authenticate, updateCurrentOrganization);
organizations_router.delete("/current", authenticate, deleteCurrentOrganization);

export default organizations_router;
