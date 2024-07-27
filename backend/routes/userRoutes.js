import express from "express";

import { Users } from "../models/userModel.js";
// import { Metadata } from "../models/metadataModel.js";
import { gfs, upload, uploadToGridFS} from "../gridFS.js";
import { ObjectId } from 'mongodb';


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

//get a User by email
router.get("/email/:email", async(request, response) => {
    try {
        const { email } = request.params;
        const User = await Users.find({ BUEmail: email });
        return response.status(200).json(User);
    } catch (err) {
        console.log(err.message);
        return response.status(500).send({ message: err.message});
    }
})

// add a User
router.post("/", async (request, response) => {
    try {
        const {
            BUEmail,
            FirstName,
            LastName,
            GradYear,
            Colleges,
            Major,
            Position,
        } = request.body;

        if (
            !request.body.BUEmail ||
            !request.body.FirstName ||
            !request.body.LastName ||
            !request.body.GradYear ||
            !request.body.Colleges ||
            !request.body.Major ||
            !request.body.Position
        ) {
            return response.status(400).send({
                message:

                    "Send all required fields: BUEmail, FirstName, LastName, GradYear, Colleges, Major, Position",
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
            GradYear,
            Colleges,
            Major,
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

router.post("/photo", upload.single('file'),uploadToGridFS, async(req, res) => {
    try {
    
        res.status(200).send({fileId: req.fileId });
      } catch (err) {
        console.error('Error uploading file:', err);
        res.status(500).send('An error occurred during the file upload.');
      }
})

router.get('/photo/all/:id', async (req, res) => {
    if (!gfs) {
      return res.status(500).send('GridFS is not initialized.');
    }

    try {

        const objectId = new ObjectId(req.params);
        const file = await gfs.find({_id:objectId}).toArray();

        if (!file || file.length === 0) {
            return res.status(404).send('File not found.');
        }

        const filesData = [];


        const readStream = gfs.openDownloadStream(objectId);
        const chunks = [];
  
        // Collect the data chunks
        readStream.on('data', (chunk) => {
          chunks.push(chunk);
        });
  
        // When the stream ends, combine the chunks into a single Buffer
        await new Promise((resolve, reject) => {
          readStream.on('end', () => {
            const buffer = Buffer.concat(chunks);
            filesData.push({
              filename: file.filename,
              contentType: file.contentType,
              data: buffer.toString('base64') // Convert the buffer to a base64 string
            });
            resolve();
          });
  
          readStream.on('error', (err) => {
            reject(err);
          });
        });

        return res.status(200).json(
          {data: filesData}
          );

    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: error.message });
    }
  });

  router.get('/photo/all', async (req, res) => {
    if (!gfs) {
      return res.status(500).send('GridFS is not initialized.');
    }
  
    try {
      const profilePics = await gfs.find().toArray();
  
      if (profilePics.length === 0) {
        return res.status(404).json({
          message: 'No files found.',
        });
      }
  
      // Prepare an array to hold the image data
      const filesData = [];
  
      for (const file of profilePics) {
        // Create a stream to read the file
        const readStream = gfs.openDownloadStream(file._id);
        const chunks = [];
  
        // Collect the data chunks
        readStream.on('data', (chunk) => {
          chunks.push(chunk);
        });
  
        // When the stream ends, combine the chunks into a single Buffer
        await new Promise((resolve, reject) => {
          readStream.on('end', () => {
            const buffer = Buffer.concat(chunks);
            filesData.push({
              fileid: file._id,
              filename: file.filename,
              contentType: file.contentType,
              data: buffer.toString('base64') // Convert the buffer to a base64 string
            });
            resolve();
          });
  
          readStream.on('error', (err) => {
            reject(err);
          });
        });
      }
  
      return res.status(200).json({
        count: profilePics.length,
        data: filesData,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ message: error.message });
    }
  });


// update a User
router.put("/:id", async (request, response) => {
    try {
        if (
            !request.body.Position
        ) {
            return response.status(400).send({
                message:
                    "Send Position",
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