import fs from 'fs';
import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import fileUpload from 'express-fileupload';
import { processFile } from './script/app';

const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 4000;
const tmp = 'tmp/';

console.log(`Preparing ${tmp} directory...`);
if (fs.existsSync(tmp)) {
  fs.readdirSync(tmp).forEach((file) => {
    fs.unlinkSync(path.join(tmp, file));
  });
} else {
  fs.mkdirSync(tmp);
}

const app = express();
app.disable('x-powered-by');
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(fileUpload());
app.use(express.static(path.join(__dirname, '/public')));

app.post('/uploadfile', (req, res, next) => {
  if (req.files && req.files.file) {
    let cfg = req.files.cfg;
    if (cfg != null) cfg = cfg.data.toString();
    let file = req.files.file;

    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(`New upload from ${ip}: ${file.name}`);

    let genSummary = (req.body && req.body.generateSummary == 'true');
    processFile(res, file, cfg, genSummary);
  } else {
    const error = new Error('Please upload a file');
    error.httpStatusCode = 400;
    return next(error);
  }
});

app.get('/download/:name', function(req, res){
  // TODO: Throw error if no name?
  var file = path.join('tmp', req.params.name);
  res.download(file, req.params.name.replace(/^\d+-/, ''), function(err) {
    if (err) {
      // TODO: Handle error
    }
    console.log(`Removing file ${file}`);
    fs.unlink(file, function(err) {
      if (err) {
        // TODO: Handle error
      }
    });
  });
});

app.listen(port, host, function () {
  console.log(`Server running at http://${host}:${port}`);
});