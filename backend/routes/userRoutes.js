import express from "express";

import { Users } from "../models/userModel.js";

const router = express.Router();

// get all Users
router.get("/", async (request, response) => {
    try {
        const UserElements = await Users.find({});
        
        return response.status(200).json({
            count: UserElements.length,
            data: UserElements,
        });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message });
    }
});

// get a User by id
router.get("/:id", async (request, response) => {
    try {
        const { id } = request.params;
        const User = await Users.findById(id);
        return response.status(200).json(User);
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message });
    }
});

// add a User
router.post("/", async (request, response) => {
    try {
        const {
            BUEmail,
            FirstName,
            LastName,
            GardYear,
            Colleges,
            Majors,
            Minors,
            Position,
        } = request.body;

        if (
            !request.body.BUEmail ||
            !request.body.FirstName ||
            !request.body.LastName ||
            !request.body.GardYear ||
            !request.body.Colleges ||
            !request.body.Majors ||
            !request.body.Minors ||
            !request.body.Position
        ) {
            return response.status(400).send({
                message:
                    "Send all required fields: BUEmail, FirstName, LastName, GardYear, Colleges, Majors, Minors, Position",
            });
        } else if (request.body.Position > 4 || request.body.Position < 0){
            return response.status(401).send({
                message:
                    "Position must be an integer 0 through 4",
            });
        }
        const newUser = new Users({
            BUEmail,
            FirstName,
            LastName,
            GardYear,
            Colleges,
            Majors,
            Minors,
            Position,
        });
        await newUser.save();
        return response
            .status(200)
            .send({ message: "User added successfully" });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message });
    }
});

// update a User
router.put("/:id", async (request, response) => {
    try {
        if (
            !request.body.BUEmail ||
            !request.body.FirstName ||
            !request.body.LastName ||
            !request.body.GardYear ||
            !request.body.Colleges ||
            !request.body.Majors ||
            !request.body.Minors ||
            !request.body.Position
        ) {
            return response.status(400).send({
                message:
                    "Send all required fields: BUEmail, FirstName, LastName, GardYear, Colleges, Majors, Minors, Position",
            });
        } else if (request.body.Position > 4 || request.body.Position < 0){
            return response.status(401).send({
                message:
                    "Position must be an integer 0 through 4",
            });
        }
        const { id } = request.params;
        const result = await Users.findByIdAndUpdate(id, request.body);
        if (!result) {
            return response.status(404).json({ message: "User not found" });
        }
        return response
            .status(200)
            .send({ message: "User updated successfully" });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message });
    }
});

// delete a User
router.delete("/:id", async (request, response) => {
    try {
        await Users.findByIdAndDelete(request.params.id);
        return response
            .status(200)
            .send({ message: "User deleted successfully" });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message });
    }
});

export default router;