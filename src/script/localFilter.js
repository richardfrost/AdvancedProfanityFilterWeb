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

    // Ensure mimetype file is first in the archive
    // Hack: add `if (a.entryName === "mimetype") {return -1}` to node_modules/adm-zip/zipFile.js
    // See: https://github.com/cthackers/adm-zip/issues/116
    zip.getEntries().forEach(function(zipEntry) {
      if (zipEntry.entryName.match(/^OEBPS\/.+\.xhtml$/i)) {
        let originalText = zipEntry.getData().toString('utf8');
        // let root = parse(originalText);
        let filteredText = filter.replaceText(originalText);
        if (originalText != filteredText) {
          filtered = true;
          zip.updateFile(zipEntry, Buffer.alloc(Buffer.byteLength(filteredText), filteredText));
        }
      }
    });

    if (filtered) {
      return zip.toBuffer();
    }
  }

  // Monkey patch to address bad zip headers
  // Patch: replace `data.writeInt32LE(_crc & 0xFFFF, Constants.CENCRC, true);` with `data.writeUInt32LE(_crc, Constants.CENCRC);`
  // See: https://github.com/cthackers/adm-zip/pull/267/files
  cleanEpubFile(source, destination) {
    let filter = this;
    let filtered = false;
    debugger;
    let zip = new AdmZip(source);

    // Ensure mimetype file is first in the archive
    // Hack: add `if (a.entryName === "mimetype") {return -1}` to node_modules/adm-zip/zipFile.js
    // See: https://github.com/cthackers/adm-zip/issues/116
    zip.getEntries().forEach(function(zipEntry) {
      if (zipEntry.entryName.match(/^OEBPS\/.+\.xhtml$/i)) {
        let originalText = zipEntry.getData().toString('utf8');
        // let root = parse(originalText);
        let filteredText = filter.replaceText(originalText);
        if (originalText != filteredText) {
          filtered = true;
          zip.updateFile(zipEntry, Buffer.alloc(Buffer.byteLength(filteredText), filteredText));
        }
      }
    });
    if (filtered) {
      zip.writeZip(destination);
    }
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

  cleanTextFile(source, destination) {
    let contents = fs.readFileSync(source).toString();
    let output = this.replaceText(contents);
    fs.writeFileSync(destination, output);
  }

  cleanText(file) {
    debugger;
    let text = file.data.toString('utf8');
    console.log(text);
    let output = this.replaceText(text);
    console.log(output);
    return (output);
  }

  foundMatch(word){
    super.foundMatch(word);
    this.summary[word] = this.summary[word] ? this.summary[word] + 1 : 1;
  }

  prepare() {
    this.generateWordList();
    this.wordRegExps = [];
    this.generateRegexpList();
    this.summary = {};
  }
}