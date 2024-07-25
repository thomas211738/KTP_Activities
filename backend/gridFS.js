import mongoose from 'mongoose';
import Grid from 'gridfs-stream';
import { GridFsStorage } from 'multer-gridfs-storage';
import multer from 'multer';
import { config } from 'dotenv';
config();

const mongoDBURL = process.env.mongoDBURL

const connection = mongoose.createConnection(mongoDBURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let gfs;
connection.once('open', () => {
  gfs = Grid(connection.db, mongoose.mongo);
  gfs.collection('uploads');
  console.log("Gridfs initialized")
});

const storage = new GridFsStorage({
    url: mongoDBURL,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        const filename = `${Date.now()}_${file.originalname}`;
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads', // Collection name
        };
        resolve(fileInfo);
      });
    },
  });

const upload = multer({ storage });

export { gfs, upload };
