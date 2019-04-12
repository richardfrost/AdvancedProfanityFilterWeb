import fs from 'fs';
import path from 'path';
import LocalConfig from './localConfig';
import LocalFilter from './localFilter';

export function processFile(res, file, cfg, genSummary = true) {
  const filter = new LocalFilter(LocalConfig.build(cfg));
  const fileName = file.name;
  const ext = path.extname(fileName);
  const timestamp = new Date().getTime();
  const streamOutput = `clean-${fileName}`;
  const fileOutput = `${timestamp}-${streamOutput}`;
  const tmpFile = `tmp/${fileOutput}`;
  const tmpDownload = encodeURI(`download/${fileOutput}`);

  try {
    let result;
    if (!genSummary) { res.attachment(streamOutput); }

    switch(ext.toLowerCase()) {
      case '.epub':
        result = filter.cleanEpub(file);
        if (result) {
          if (genSummary) {
            result.writeZip(tmpFile); // TODO: Error handling
            let data = {summary: filter.summary, downloadHref: tmpDownload};
            res.render('pages/summary', data);
          } else {
            res.send(result.toBuffer());
          }
        } else {
          res.send('Nothing was filtered');
        }
        break;
      case '.md':
      case '.srt':
      case '.txt':
        result = filter.cleanText(file);
        if (result) {
          if (genSummary) {
            fs.writeFile(tmpFile, result, function(err) {
              if (err) {
                res.send('Error! Failed to write file');
              } else {
                let data = {summary: filter.summary, downloadHref: tmpDownload};
                res.render('pages/summary', data);
              }
            });
          } else {
            res.send(result);
          }
        } else {
          res.send('Nothing was filtered');
        }
        break;
      default:
        // filter.cleanOtherFile(file);
    }
  } catch (e) {
    console.log('Error', e);
  }
}