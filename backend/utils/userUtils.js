import { Users } from '../models/userModel.js'; 

let allUsersInfo = null;

export const getAllUsersInfo = () => allUsersInfo;

export const setAllUsersInfo = (newAllUsersInfo) => {
  allUsersInfo = newAllUsersInfo;
};

export const fetchAndSetAllUsersInfo = async () => {
  try {
    const users = await Users.find({});
    setAllUsersInfo(users);
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};
