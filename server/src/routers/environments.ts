import express from "express";
import { createEnvironment, listEnvironments } from "../controllers/environments.js";
import { authenticate } from "../middlewares/auth.js";

const environments_router = express.Router();

environments_router.post("/", authenticate, createEnvironment);
environments_router.get("/:projectId", authenticate, listEnvironments);

export default environments_router;
