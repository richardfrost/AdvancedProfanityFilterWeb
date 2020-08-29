import Constants from './constants';
import Word from './word';
import Wordlist from './wordlist';
export default class Filter {
    constructor() {
        this.counter = 0;
        this.iWhitelist = [];
        this.whitelist = [];
        this.wordlists = {};
    }
    buildWordlist(wordlistId, rebuild = false) {
        if (wordlistId === false) {
            wordlistId = this.wordlistId;
        }
        // Generate a new wordlist if required
        if (rebuild || !this.wordlists[wordlistId]) {
            this.wordlists[wordlistId] = new Wordlist(this.cfg, wordlistId);
        }
        return wordlistId;
    }
    checkWhitelist(match, string, matchStartIndex, word) {
        let self = this;
        let whitelistLength = self.whitelist.length;
        let iWhitelistLength = self.iWhitelist.length;
        if (whitelistLength || iWhitelistLength) {
            // Check for exact/whole match (match case)
            if (whitelistLength && self.whitelist.includes(match)) {
                return true;
            }
            // Check for exact/whole match (case insensitive)
            if (iWhitelistLength && self.iWhitelist.includes(match.toLowerCase())) {
                return true;
            }
            // Check for partial match (match may not contain the full whitelisted word)
            if (word.matchMethod === Constants.MatchMethods.Partial) {
                let wordOptions = {
                    matchMethod: Constants.MatchMethods.Whole,
                    repeat: false,
                    separators: false,
                    sub: ''
                };
                let wholeWordRegExp = new Word(match, wordOptions, this.cfg).regExp;
                let result;
                while ((result = wholeWordRegExp.exec(string)) !== null) {
                    let resultMatch = result.length == 4 ? result[2] : result[0];
                    let resultIndex = result.length == 4 ? result.index + result[1].length : result.index;
                    // Make sure this is the match we want to check
                    if (resultIndex <= matchStartIndex
                        && (resultIndex + resultMatch.length) >= (matchStartIndex + match.length)) {
                        if (whitelistLength && self.whitelist.includes(resultMatch)) {
                            return true;
                        }
                        if (iWhitelistLength && self.iWhitelist.includes(resultMatch.toLowerCase())) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }
    foundMatch(word) {
        this.counter++;
    }
    init(wordlistId = false) {
        this.iWhitelist = this.cfg.iWordWhitelist;
        this.whitelist = this.cfg.wordWhitelist;
        if (this.wordlistId === undefined) {
            this.wordlistId = this.cfg.wordlistId == null ? 0 : this.cfg.wordlistId;
        }
        this.buildWordlist(wordlistId);
    }
    matchData(wordlist, index, match, args) {
        let word = wordlist.find(index);
        let string = args.pop();
        let matchStartIndex = args.pop();
        let captureGroups = args;
        // (boundary)(match)(boundary): Used internally for several types of matches:
        // - Remove Filter
        // - Unicode word boundaries (workaround)
        // - Edge punctuation
        let internalCaptureGroups = (captureGroups.length > 0 && word.matchMethod !== Constants.MatchMethods.Regex);
        if (internalCaptureGroups) {
            match = captureGroups[1];
        }
        return { word: word, string: string, match: match, matchStartIndex: matchStartIndex, captureGroups: captureGroups, internalCaptureGroups: internalCaptureGroups };
    }
    rebuildWordlists() {
        let self = this;
        Object.keys(this.wordlists).forEach(function (key) {
            self.buildWordlist(parseInt(key), true);
        });
    }
    replaceText(str, wordlistId = false, stats = true) {
        let self = this;
        wordlistId = self.buildWordlist(wordlistId);
        let wordlist = self.wordlists[wordlistId];
        switch (self.cfg.filterMethod) {
            case Constants.FilterMethods.Censor:
                wordlist.regExps.forEach((regExp, index) => {
                    str = str.replace(regExp, function (originalMatch, ...args) {
                        let { word, string, match, matchStartIndex, captureGroups, internalCaptureGroups } = self.matchData(wordlist, index, originalMatch, args);
                        if (self.checkWhitelist(match, string, matchStartIndex, word)) {
                            return match;
                        } // Check for whitelisted match
                        if (stats) {
                            self.foundMatch(word);
                        }
                        // Filter
                        let censoredString = '';
                        let censorLength = self.cfg.censorFixedLength > 0 ? self.cfg.censorFixedLength : match.length;
                        if (self.cfg.preserveFirst && self.cfg.preserveLast) {
                            censoredString = match[0] + self.cfg.censorCharacter.repeat(censorLength - 2) + match.slice(-1);
                        }
                        else if (self.cfg.preserveFirst) {
                            censoredString = match[0] + self.cfg.censorCharacter.repeat(censorLength - 1);
                        }
                        else if (self.cfg.preserveLast) {
                            censoredString = self.cfg.censorCharacter.repeat(censorLength - 1) + match.slice(-1);
                        }
                        else {
                            censoredString = self.cfg.censorCharacter.repeat(censorLength);
                        }
                        if (internalCaptureGroups) {
                            censoredString = captureGroups[0] + censoredString + captureGroups[2];
                        }
                        return censoredString;
                    });
                });
                break;
            case Constants.FilterMethods.Substitute:
                wordlist.regExps.forEach((regExp, index) => {
                    str = str.replace(regExp, function (originalMatch, ...args) {
                        let { word, string, match, matchStartIndex, captureGroups, internalCaptureGroups } = self.matchData(wordlist, index, originalMatch, args);
                        if (self.checkWhitelist(match, string, matchStartIndex, word)) {
                            return match;
                        } // Check for whitelisted match
                        if (stats) {
                            self.foundMatch(word);
                        }
                        // Filter
                        let sub = word.sub || self.cfg.defaultSubstitution;
                        // Make substitution match case of original match
                        if (self.cfg.preserveCase) {
                            if (Word.allUpperCase(match)) {
                                sub = sub.toUpperCase();
                            }
                            else if (Word.capitalized(match)) {
                                sub = Word.capitalize(sub);
                            }
                        }
                        if (self.cfg.substitutionMark) {
                            sub = '[' + sub + ']';
                        }
                        if (internalCaptureGroups) {
                            sub = captureGroups[0] + sub + captureGroups[2];
                        }
                        return sub;
                    });
                });
                break;
            case Constants.FilterMethods.Remove:
                wordlist.regExps.forEach((regExp, index) => {
                    str = str.replace(regExp, function (originalMatch, ...args) {
                        let { word, string, match, matchStartIndex, captureGroups, internalCaptureGroups } = self.matchData(wordlist, index, originalMatch, args);
                        if (self.checkWhitelist(match.trim(), string, matchStartIndex, word)) {
                            return match;
                        } // Check for whitelisted match
                        if (stats) {
                            self.foundMatch(word);
                        }
                        // Filter
                        if (internalCaptureGroups) {
                            if (Word.whitespaceRegExp.test(captureGroups[0]) && Word.whitespaceRegExp.test(captureGroups[2])) { // If both surrounds are whitespace (only need 1)
                                return captureGroups[0];
                            }
                            else if (Word.nonWordRegExp.test(captureGroups[0]) || Word.nonWordRegExp.test(captureGroups[2])) { // If there is more than just whitesapce (ex. ',')
                                return (captureGroups[0] + captureGroups[2]).trim();
                            }
                            else {
                                return '';
                            }
                        }
                        else {
                            // Don't remove both leading and trailing whitespace
                            if (Word.whitespaceRegExp.test(match[0]) && Word.whitespaceRegExp.test(match[match.length - 1])) {
                                return match[0];
                            }
                            else {
                                return '';
                            }
                        }
                    });
                });
                break;
        }
        return str;
    }
    replaceTextResult(str, wordlistId = false, stats = true) {
        let result = {
            original: str,
            filtered: this.replaceText(str, wordlistId, stats),
            modified: false
        };
        result.modified = (result.filtered != str);
        return result;
    }
}
