import axios from "axios"
import { BACKEND_URL } from "@env"

export async function GetImage(picid) {

    try {
        const response = await axios.get(`${BACKEND_URL}/users/photo/all/${picid}`);
        return response.data.data[0].data;

    } catch (err) {
        console.log(err);
    }
}

