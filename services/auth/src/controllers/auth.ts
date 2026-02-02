import { TryCatch } from "../utils/TryCatch.js"
import getBuffer from "../utils/buffer.js"
import { sql } from "../utils/db.js"
import ErrorHandler from "../utils/errorHandler.js"
import bcrypt from 'bcrypt'
import axios from 'axios'

export const registerUser = TryCatch(async(req, res, next) => {
    const { name, email, password, phoneNumber, role, bio } = req.body
    
    if( !name 
        || !email
        || !password
        || !phoneNumber
        || !role
        || !bio
    ){
        throw new ErrorHandler(400, "Please fill all the details")
    }

    const existingUser = await sql`SELECT user_id FROM users WHERE email = ${email}`;

    if(existingUser.length > 0)
    {
        throw new ErrorHandler(409, "User already exists")
    }

    const hashPassword = await bcrypt.hash(password, 10);

    let registerUser;

    let [user] :any = null;
    
    switch(role)
    {
        case "RECURITER":
            [user] = await sql`INSERT INTO users (name, email, password, phone_number, role) VALUES
                            (${name}, ${email}, ${hashPassword}, ${phoneNumber}, ${role}) RETURNING
                            user_id, name, emmail, phone_number, role, created_at`;
            registerUser = user;
            break;

        case "JOBSEEKER":
            const file = req.file

            if(!file)
                throw new ErrorHandler(400, "Resume is rqeuired");
            
            const fileBuffer = getBuffer(file);

            if( !fileBuffer || !fileBuffer.content )
                throw new ErrorHandler(500, 'Failed tp generate buffer');

            const {data} = await axios.post(
                `${process.env.UPLOAD_SERVICE}/api/utils/upload`,
                { buffer: fileBuffer.content }
            );

            [user] = await sql`INSERT INTO users 
                            (name, email, password, phone_number, role, bio, resume, resume_public_id) VALUES
                            (${name}, ${email}, ${hashPassword}, ${phoneNumber}, 
                            ${role}, ${bio}, ${data.url}, ${data.public_id}) RETURNING
                            user_id, name, email, phone_number, role, bio, resume, created_at`;

            registerUser = user;
            break;
    }

    res.json(email)
})