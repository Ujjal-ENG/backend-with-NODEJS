/* eslint-disable import/no-extraneous-dependencies */
import express from 'express';

const app = express();

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
