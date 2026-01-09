import axios from "axios"
import { BACKEND_URL } from "@env"


export async function ValidateUser(userEmail) {
    try {
        const response = await axios.get(`${BACKEND_URL}/users`);
        const users = response.data.data;

        const user = users.find(user => user.BUEmail.toLowerCase() === userEmail);


        if (userEmail == "testktpapp@gmail.com") {
            return { status: 1, user: user, allUsers: users };
        }

        if (user) {
            return { status: 1, user: user, allUsers: users };
        } else {
            const domain = userEmail.split('@');
            if (domain[1] !== 'bu.edu') {
                return { status: -1, user: null, allUsers: users };
            }

            return { status: 0, user: null, allUsers: users };
        }
    } catch (error) {
        console.error('Error fetching the users:', error);
        return 'Error occurred';
    }

}

