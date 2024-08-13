
import express from "express";
import { UserPhotos } from "../models/userphotosModel.js";

const router = express.Router();


// Post a photo
router.post("/photo", async(request, res) => {
    try {  
        const {
            data
        } = request.body;

        if ( !request.body.data ) {
            return response.status(400).send({
                message: "Send data",
        })} else{
        
        console.log(data);

        const newUserPhoto = new UserPhotos({data : data});

        const savedUserPhoto = await newUserPhoto.save();

        const fileId = {fileID: savedUserPhoto._id}; // Get the ID of the saved user photo

        res.status(200).send( fileId );

        }
        
    } catch (err) {
        console.error('Error uploading file:', err);
        res.status(500).send('An error occurred during the file upload.');
    }
})

// Get one photo by id
router.get('/photo/:id', async (request, response) => {
    try {
        const { id } = request.params;
        const userphoto = await UserPhotos.findById(id);
        return response.status(200).json(userphoto);
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message });
    }
  });

    // Get all photos
  router.get('/photos', async (request, response) => {
    try {
        const AllUserPhotos = await UserPhotos.find({});
        return response.status(200).json({
            count: AllUserPhotos.length,
            data: AllUserPhotos,
        });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message });
    }

  });

  router.put("/photo/:id", async (request, response) => {
    try {
        const { id } = request.params;
        const file = request.body;
        const result = await UserPhotos.findByIdAndUpdate(id, {file});
        return response.status(200).json(result._id);

    }catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message });
    }
    });

    //   Delete a photo by id
  router.delete("/photo/:id", async (request, response) => {
    try {
        await UserPhotos.findByIdAndDelete(request.params.id);
        return response
            .status(200)
            .send({ message: "User deleted successfully" });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message });
    }
  });




export default router;

