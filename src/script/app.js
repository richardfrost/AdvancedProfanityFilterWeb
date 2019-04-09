import path from 'path';
import LocalConfig from './localConfig';
import LocalFilter from './localFilter';

// TODO: Maybe use res.req query param for fast download, otherwise save to tmp?
export function processFile(res, file, cfg) {
  const filter = new LocalFilter(LocalConfig.build(cfg.data.toString()));
  const fileName = file.name;
  const ext = path.extname(fileName);
  const output = `clean-${fileName}`;
  let result;
  filter.summary = {};

  try {
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
  catch (e) {
    console.log('Error', e);
  }
}