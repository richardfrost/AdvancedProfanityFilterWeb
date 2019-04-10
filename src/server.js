import express from 'express';
import bodyParser from 'body-parser';
import fileUpload from 'express-fileupload';

import { processFile } from './script/app';
const port = process.env.PORT || 4000;
const host = process.env.HOST || 'localhost';

const app = express();
app.disable('x-powered-by');
app.use(fileUpload());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));

app.post('/uploadfile', (req, res, next) => {
  if (req.files && req.files.file) {
    let cfg = req.files.cfg;
    if (cfg != null) cfg = cfg.data.toString();
    let file = req.files.file;
    let genSummary = (req.body && req.body.generateSummary == 'true');
    processFile(res, file, cfg, genSummary);
  } else {
    const error = new Error('Please upload a file');
    error.httpStatusCode = 400;
    return next(error);
  }
});

app.listen(port, host, function () {
  console.log(`Server running at http://${host}:${port}`);
});