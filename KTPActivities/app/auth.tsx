import axios from "axios"


export async function ValidateUser(userEmail) {
    try {
        const response = await axios.get('http://localhost:5555/users');
        const users = response.data.data;

        const userFound = users.some(user => user.BUEmail.toLowerCase() === userEmail);

        if (userFound) {
            return 'User found';
        } else {
            const domain = userEmail.split('@');
            if (domain[1] !== 'bu.edu') {
                return 'User not using BU email';
            }

            return 'User not found';
        }
        

    } catch (error) {
        console.error('Error fetching users:', error);
        return 'Error occurred';
    }

}

