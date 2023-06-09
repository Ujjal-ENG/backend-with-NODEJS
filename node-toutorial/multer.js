/* eslint-disable operator-linebreak */
/* eslint-disable import/no-extraneous-dependencies */
import express from 'express';
import multer from 'multer';
import path from 'path';

const UPLOADS_FOLDER = '../node-toutorial/upload';

const app = express();
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_FOLDER);
    },
    filename: (req, file, cb) => {
        const fileExt = path.extname(file.originalname);
        const fileName = `${file.originalname
            .replace(fileExt, '')
            .toLowerCase()
            .split(' ')
            .join('-')}-${Date.now()}`;
        cb(null, fileName + fileExt);
    },
});
const upload = multer({
    storage,
    dest: UPLOADS_FOLDER,
    limits: {
        fileSize: 1000000,
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
