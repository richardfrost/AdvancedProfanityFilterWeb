import Constants from './lib/constants';
import Filter from './lib/filter';
import AdmZip from 'adm-zip';
import textract from 'textract';
import { parse } from 'node-html-parser';

export default class LocalFilter extends Filter {
  constructor(config) {
    super();
    this.summary = {};
    this.cfg = config;
    this.init();
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

    // To be a valid epub, the `mimetype` file must be the first in the archive
    // As of ADM-ZIP version 0.4.16 we have to modify the code to make sure this happens:
    // Add the following code as the first line in the sort compareFunction in node_modules/adm-zip/zipFile.js inside the compressToBuffer() function
    // ```if (a.entryName === 'mimetype') { return -1; } else if (b.entryName === 'mimetype') { return 1; }```
    zip.getEntries().forEach(function(zipEntry) {
      if (zipEntry.entryName.match(/^.+\.x?html$/i)) {
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
    if (this.summary[word.value]) {
      this.summary[word.value].count += 1;
    } else {
      let filtered;
      if (word.matchMethod == Constants.MatchMethods.Regex) { // Regexp
        filtered = word.sub || this.cfg.defaultSubstitution;
      } else {
        filtered = this.replaceText(word.value, 0, false);
      }

      this.summary[word.value] = { filtered: filtered, count: 1 };
    }
  }
}