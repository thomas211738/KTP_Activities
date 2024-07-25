import mongoose from "mongoose";

const metadataSchema = new mongoose.Schema({
    description: String,
    // other metadata fields...
  }, { timestamps: true });
  
  export const Metadata = mongoose.model('Metadata', metadataSchema);