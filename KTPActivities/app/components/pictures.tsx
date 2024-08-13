import axios from "axios"
import { BACKEND_URL } from "@env"

export async function GetImage(picid) {

    try {
        const response = await axios.get(`${BACKEND_URL}/photo/photo/${picid}`);
        return response.data.data;

    } catch (err) {
        console.log(err);
    }
}

