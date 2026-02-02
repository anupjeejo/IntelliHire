import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
app.listen(process.env.PORT, () => {
    console.log(`Util service is running on PORT: ${process.env.PORT}`);
});
