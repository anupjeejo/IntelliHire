import { TryCatch } from "../utils/TryCatch.js";
import { sql } from "../utils/db.js";
import ErrorHandler from "../utils/errorHandler.js";
export const registerUser = TryCatch(async (req, res, next) => {
    const { name, email, password, phoneNumber, role, bio } = req.body;
    if (!name
        || !email
        || !password
        || !phoneNumber
        || !role
        || !bio) {
        throw new ErrorHandler(400, "Please fill all the details");
    }
    const existingUser = await sql `SELECT user_id FROM users WHERE email = ${email}`;
    res.json(email);
});
