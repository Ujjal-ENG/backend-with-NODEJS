/* eslint-disable import/no-extraneous-dependencies */
import express from 'express';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());

// connection code for mongoDB using mongoose
mongoose
    .connect('mongodb+srv://ujjal:J4dyr2YSsN2XJbcQ@cluster0.n44zgvg.mongodb.net/todos', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('Connected');
    })
    .catch((err) => console.log(err));
app.get('/', (req, res) => {
    res.send('hello there from Home Page');
});

app.use((err, req, res, next) => {
    if (err.message) {
        res.send(err.message);
    }
    res.send('There are something wrong occured');
    next();
});

app.listen(3000, () => {
    console.log('Server is runnign on at: 3000');
});
