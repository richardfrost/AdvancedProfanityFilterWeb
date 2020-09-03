import fse from 'fs-extra';
import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import fileUpload from 'express-fileupload';
import { processFile } from './script/app';
import favicon from 'serve-favicon';

const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 4000;
const tmp = 'tmp/';

console.log(`Preparing ${tmp} directory...`);
fse.emptyDirSync(tmp);

console.log('Starting app...')
const app = express();
app.disable('x-powered-by');
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(express.static(path.join(__dirname, '/public')));
app.use(fileUpload({
  abortOnLimit: true,
  limits: { fileSize: 5 * 1024 * 1024 },
}));

app.get(['/', '/index.html'], (req, res, next) => {
  res.render('pages/index');
});

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

app.get('/download/:name', function(req, res) {
  // TODO: Throw error if no name?
  var file = path.join('tmp', req.params.name);
  console.log(`User started downloading file ${file}`);
  res.download(file, req.params.name.replace(/^\d+-/, ''), function(err) {
    if (err) {
      // TODO: Handle error
    }
    console.log(`Removing file ${file}`);
    fse.unlink(file, function(err) {
      if (err) {
        // TODO: Handle error
      }
    });
  });
});

app.listen(port, host, function () {
  console.log(`Server running at http://${host.replace('0.0.0.0', 'localhost')}:${port}`);
});