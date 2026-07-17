import express from 'express';

const user_router = express.Router()

user_router.get("/", (req, res) => {
	return res.json({ detail: "users root" })
})

user_router.post("/", (req, res) => {
	return res.status(201).json({ detail: "create user - not implemented" })
})

user_router.delete("/", (req, res) => {
	return res.status(204).send()
})

user_router.patch("/", (req, res) => {
	return res.status(200).json({ detail: "patch user - not implemented" })
})

user_router.put("/", (req, res) => {
	return res.status(200).json({ detail: "replace user - not implemented" })
})

export default user_router;