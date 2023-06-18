import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';

dotenv.config();

const PORT = process.env.PORT || 8080;

const app = express();

// default middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// default route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'This is a deafult route!!!' });
});

// listen route
app.listen(PORT, () => {
    console.log('Server is running at 8080 PORT');
});
