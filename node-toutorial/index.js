/* eslint-disable operator-linebreak */
/* eslint-disable import/no-extraneous-dependencies */
import express from 'express';
import multer from 'multer';

const UPLOADS_FOLDER = '../node-toutorial/upload';

const app = express();

const upload = multer({
    dest: UPLOADS_FOLDER,
    limits: {
        fileSize: 1000000,
    },
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype === 'image/jpeg' ||
            file.mimetype === 'image/jpg' ||
            file.mimetype === 'image/png'
        ) {
            cb(null, true);
        } else {
            cb(new Error('File must be jpeg/png/jpg format'));
        }
    },
});

app.post('/', upload.single('avatar'), (req, res) => {
    res.send('Hello there');
});

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
