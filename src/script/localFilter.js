import {Filter} from './lib/filter';
import AdmZip from 'adm-zip';
import textract from 'textract';
import { parse } from 'node-html-parser';

export default class LocalFilter extends Filter {
  constructor(config) {
    super();
    this.summary = {};
    this.cfg = config;
    this.prepare();
  }

  // Main file: word/document.xml
  // rels/.rels - Contains information about the structure of the document. It contains paths to the metadata information as well as the main XML document that contains the content of the document itself.
  // docProps/ - Metadata information are usually stored. app.xml & core.xml
  cleanDocx(file) {
    let filter = this;
    let filtered = false;
    let zip = new AdmZip(file.data);

    zip.getEntries().forEach(function(zipEntry) {
      if (zipEntry.entryName.match(/^word\/\w+\.xml$/i)) {
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

  cleanOther(file) {
    let filter = this;
    let output = textract.fromBufferWithMime(file.mimetype, file.data, function(err, text) {
      if (err) throw(`Failed to read file: ${file.name}`);
      filter.replaceText(text);
    });
    return (filter.summary != {}) ? output : false;
  }

  cleanOtherFromFile(source, destination) {
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
      this.summary[word].count += 1;
    } else {
      let filtered;
      if (this.cfg.words[word].matchMethod == 4) { // Regexp
        filtered = this.cfg.words[word].sub || this.cfg.defaultSubstitution;
      } else {
        filtered = this.replaceText(word, false);
      }

      this.summary[word] = { filtered: filtered, count: 1 };
    }
  }

  prepare() {
    this.generateWordList();
    this.wordRegExps = [];
    this.generateRegexpList();
    this.summary = {};
  }
}