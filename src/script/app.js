import path from 'path';
import LocalConfig from './localConfig';
import LocalFilter from './localFilter';

export function processFile(res, file, cfg, genSummary = true) {
  const filter = new LocalFilter(LocalConfig.build(cfg));
  const fileName = file.name;
  const ext = path.extname(fileName);
  const output = `clean-${fileName}`;
  let result;
  filter.summary = {};

  try {
    if (genSummary) {
      // TODO: Save file to /tmp
      switch(ext.toLowerCase()) {
        case '.epub':
          filter.cleanEpub(file);
          res.send(filter.summary);
          break;
        case '.md':
        case '.srt':
        case '.txt':
          filter.cleanText(file);
          res.send(filter.summary);
          break;
        default:
          // filter.cleanOtherFile(file);
      }
    } else { // Stream file directly to client
      res.attachment(output);
      switch(ext.toLowerCase()) {
        case '.epub':
          result = filter.cleanEpub(file);
          res.send(result);
          break;
        case '.md':
        case '.srt':
        case '.txt':
          res.send(filter.cleanText(file));
          break;
        default:
          filter.cleanOtherFile(f.path, output);
      }
    }
  } catch (e) {
    console.log('Error', e);
  }
}