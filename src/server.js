import express from 'express';
import bodyParser from 'body-parser';
import fileUpload from 'express-fileupload';

import { processFile } from './script/app';
const port = process.env.PORT || 4000;

const app = express();
app.disable('x-powered-by');
app.use(fileUpload());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));

app.post('/uploadfile', (req, res, next) => {
  let cfg = req.files.cfg;
  let file = req.files.file;
  if (!file) {
    const error = new Error('Please upload a file');
    error.httpStatusCode = 400;
    return next(error);
  }
  processFile(res, file, cfg);
});

app.listen(port, function () {
  console.log(`Example app listening on port ${port}`);
});