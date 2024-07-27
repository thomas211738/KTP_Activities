import multer from 'multer';
import { config } from 'dotenv';
import { Readable } from 'stream';
import { MongoClient, GridFSBucket } from 'mongodb';


config();

const mongoDBURL = process.env.mongoDBURL

let db, gfs;
MongoClient.connect(mongoDBURL)
  .then((client) => {
    db = client.db('test');
    gfs = new GridFSBucket(db, { bucketName: 'uploads' });
    console.log('Connected to MongoDB and GridFS initialized');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

export { db, gfs };



const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadToGridFS = (req, res, next) => {
  if (!gfs) {
    return res.status(500).send('GridFS is not initialized.');
  }

  const file = req.file;
  if (!file) {
    return res.status(400).send('File upload failed.');
  }

  const readableStream = new Readable();
  readableStream.push(file.buffer);
  readableStream.push(null);

  const uploadStream = gfs.openUploadStream(file.originalname, {
    contentType: file.mimetype,
  });

  readableStream.pipe(uploadStream)
    .on('error', (error) => {
      console.error('Error uploading to GridFS:', error);
      res.status(500).send('Error uploading file.');
    })
    .on('finish', () => {
      console.log('File uploaded to GridFS with ID:', uploadStream.id);
      req.fileId = uploadStream.id;
      next();
    });
};

export { upload, uploadToGridFS };
