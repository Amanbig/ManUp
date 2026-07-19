import express from "express";
import { createProject, listProjects, getProject } from "../controllers/projects.js";
import { authenticate } from "../middlewares/auth.js";

const projects_router = express.Router();

projects_router.post("/", authenticate, createProject);
projects_router.get("/", authenticate, listProjects);
projects_router.get("/:id", authenticate, getProject);

export default projects_router;
