import Config from './lib/config';
// import fs from 'fs';

export default class LocalConfig extends Config {
  constructor(config) {
    super(config);
  }

  static build(cfg) {
    try {
      if (cfg == null) {
        cfg = Config._defaults;
        cfg.words = Config._defaultWords;
      } else if (typeof cfg === 'string') {
        cfg = JSON.parse(cfg);
      } else {
        throw 'Invalid config file.';
      }
      return new LocalConfig(cfg);
    } catch(e) {
      console.log('error importing config', e);
    }
  }

  // static readJSONFromFile(file) {
  //   return JSON.parse(fs.readFileSync(file));
  // }
}