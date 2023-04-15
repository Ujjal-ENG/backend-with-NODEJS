/* eslint-disable import/extensions */
/* eslint-disable import/no-extraneous-dependencies */
import express from 'express';
import mongoose from 'mongoose';
import todoHandler from './routeHandler/todoHandler.js';
import userHandler from './routeHandler/userHandler.js';

const app = express();
app.use(express.json());

// connection code for mongoDB using mongoose

app.get('/', (req, res) => {
    res.send('hello there from Home Page');
});

app.use('/todo', todoHandler);
app.use('/user', userHandler);

app.use((err, req, res, next) => {
    if (err.message) {
        res.send(err.message);
    }
    res.send('There are something wrong occured');
    next();
});

mongoose
    .connect('mongodb+srv://ujjal:J4dyr2YSsN2XJbcQ@cluster0.n44zgvg.mongodb.net/todos', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('Connected');
    })
    .catch((err) => console.log(err));
app.listen(3000, () => {
    console.log('Server is runnign on at: 3000');
});
