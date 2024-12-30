import mongoose from "mongoose";

const notificationScehma = mongoose.Schema(
    {
    userID:{
        type: String,
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
    },
    {
        timestamps: true,
    }
);

export const NotificationModel = mongoose.model(
    "Notification Element",
    notificationScehma,
    "notifications-collection"
);
