import express from "express";
import { createEnvironment, listEnvironments, getEnvironment, updateEnvironment, deleteEnvironment } from "../controllers/environments.js";
import { authenticate } from "../middlewares/auth.js";

const environments_router = express.Router();

environments_router.post("/", authenticate, createEnvironment);
environments_router.get("/detail/:id", authenticate, getEnvironment);
environments_router.get("/:projectId", authenticate, listEnvironments);
environments_router.put("/:id", authenticate, updateEnvironment);
environments_router.delete("/:id", authenticate, deleteEnvironment);

export default environments_router;
