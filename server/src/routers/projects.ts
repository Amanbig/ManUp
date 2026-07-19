import express from "express";
import { createProject, listProjects, getProject, updateProject, deleteProject } from "../controllers/projects.js";
import { authenticate } from "../middlewares/auth.js";

const projects_router = express.Router();

projects_router.post("/", authenticate, createProject);
projects_router.get("/", authenticate, listProjects);
projects_router.get("/:id", authenticate, getProject);
projects_router.put("/:id", authenticate, updateProject);
projects_router.delete("/:id", authenticate, deleteProject);

export default projects_router;
