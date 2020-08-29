import Word from './word';
export default class Wordlist {
    constructor(cfg, wordlistId) {
        let self = this;
        this.all = [];
        this.list = [];
        this.regExps = [];
        // Sort the words array by longest (most-specific) first
        let sorted = Object.keys(cfg.words).sort((a, b) => {
            return b.length - a.length;
        });
        // Process list of words
        sorted.forEach(wordStr => {
            // wordlistId = 0 includes all words
            if (wordlistId === 0 || !Array.isArray(cfg.words[wordStr].lists) || cfg.words[wordStr].lists.includes(wordlistId)) {
                self.list.push(wordStr);
                let word = new Word(wordStr, cfg.words[wordStr], cfg);
                self.all.push(word);
                self.regExps.push(word.regExp);
            }
        });
    }
    find(value) {
        if (typeof value === 'string') {
            return this.all[this.list.indexOf(value)];
        }
        else if (typeof value === 'number') {
            return this.all[value];
        }
    }
}
