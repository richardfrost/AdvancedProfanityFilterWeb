import {Filter} from './lib/filter';
import AdmZip from 'adm-zip';
import textract from 'textract';
// import { parse } from 'node-html-parser';

export default class LocalFilter extends Filter {
  constructor(config) {
    super();
    this.summary = {};
    this.cfg = config;
    this.prepare();
  }

  cleanEpub(file) {
    let filter = this;
    let filtered = false;
    let zip = new AdmZip(file.data);
    // let zip = new AdmZip(source);

    // Ensure mimetype file is first in the archive
    // Hack: add `if (a.entryName === "mimetype") {return -1}` to node_modules/adm-zip/zipFile.js
    // See: https://github.com/cthackers/adm-zip/issues/116
    zip.getEntries().forEach(function(zipEntry) {
      if (zipEntry.entryName.match(/^OEBPS\/.+\.xhtml$/i)) {
        let originalText = zipEntry.getData().toString('utf8');
        let filteredText = filter.replaceText(originalText);
        if (originalText != filteredText) {
          filtered = true;
          zip.updateFile(zipEntry, Buffer.alloc(Buffer.byteLength(filteredText), filteredText));
        }
      }
    });

    return filtered ? zip : false;
  }

  cleanOtherFile(source, destination) {
    let filter = this;
    textract.fromFileWithPath(source, function(error, text) {
      if (!error) {
        let output = filter.replaceText(text);
        if (text != output) {
          fs.writeFileSync(destination, output);
        }
      }
    });
  }

  cleanText(file) {
    // let contents = fs.readFileSync(source).toString();
    let text = file.data.toString('utf8');
    let output = this.replaceText(text);
    return (this.summary != {}) ? output : false;
  }

  foundMatch(word) {
    super.foundMatch(word);
    if (this.summary[word]) {
      this.summary[word].count = this.summary[word].count + 1;
    } else {
      this.summary[word] = { count: 1, sub: this.replaceText(word, false) };
    }
  }

  finalizeSummary() {
    let complete = {};

  }

  prepare() {
    this.generateWordList();
    this.wordRegExps = [];
    this.generateRegexpList();
    this.summary = {};
  }
}