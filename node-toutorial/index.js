/* eslint-disable import/no-extraneous-dependencies */
import express from 'express';

const app = express();

app.get('/', (req, res) => {
    res.send('Hello there');
});

app.use((req, res, next) => {
    next('This route is not define in this site');
});

app.use((err, req, res, next) => {
    console.log(err);
    if (err.message) {
        res.status(500).send(err.message);
    }
    res.status(500).send('There was an error');
    next();
});

app.listen(3000, () => {
    console.log(`Server is running at ${3000}`);
});
