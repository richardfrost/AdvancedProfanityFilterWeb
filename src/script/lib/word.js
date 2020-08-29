import Constants from './constants';
export default class Word {
    constructor(word, options, cfg) {
        this.value = word;
        this.lists = options.lists === undefined ? [] : options.lists;
        this.matchMethod = options.matchMethod === undefined ? cfg.defaultWordMatchMethod : options.matchMethod;
        this.matchRepeated = options.repeat === undefined ? cfg.defaultWordRepeat : options.repeat;
        this.matchSeparators = options.separators === undefined ? cfg.defaultWordSeparators : options.separators;
        this.sub = options.sub === undefined ? cfg.defaultSubstitution : options.sub;
        this._filterMethod = options._filterMethod === undefined ? cfg.filterMethod : options._filterMethod;
        this.unicode = Word.containsDoubleByte(word);
        this.escaped = this.matchMethod === Constants.MatchMethods.Regex ? this.value : Word.escapeRegExp(this.value); // Don't escape a RegExp
        this.regExp = this.buildRegExp();
    }
    static allLowerCase(string) {
        return string.toLowerCase() === string;
    }
    static allUpperCase(string) {
        return string.toUpperCase() === string;
    }
    static capitalize(string) {
        return string.charAt(0).toUpperCase() + string.substr(1);
    }
    static capitalized(string) {
        return string.charAt(0).toUpperCase() === string.charAt(0);
    }
    static containsDoubleByte(str) {
        if (!str.length)
            return false;
        if (str.charCodeAt(0) > 127)
            return true;
        return Word._unicodeRegExp.test(str);
    }
    // /[-\/\\^$*+?.()|[\]{}]/g
    // /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g
    // Removing '-' for '/пресс-релиз/, giu'
    static escapeRegExp(str) {
        return str.replace(Word._escapeRegExp, '\\$&');
    }
    buildRegExp() {
        let word = this;
        try {
            switch (word.matchMethod) {
                case Constants.MatchMethods.Partial:
                    if (word._filterMethod === Constants.FilterMethods.Remove) {
                        // Match entire word that contains sub-string and surrounding whitespace
                        // /\s?\b[\w-]*word[\w-]*\b\s?/gi
                        if (word.unicode) {
                            // Work around for lack of word boundary support for unicode characters
                            // /(^|[\s.,'"+!?|-]?)[\w-]*(word)[\w-]*([\s.,'"+!?|-]?|$)/giu
                            return new RegExp('(^|' + Word._unicodeWordBoundary + '?)([\\w-]*' + word.processedPhrase() + '[\\w-]*)(' + Word._unicodeWordBoundary + '?|$)', word.regexOptions());
                        }
                        else if (word.hasEdgePunctuation()) { // Begin or end with punctuation (not \w))
                            return new RegExp('(^|\\s)([\\w-]*' + word.processedPhrase() + '[\\w-]*)(\\s|$)', word.regexOptions());
                        }
                        else {
                            return new RegExp('\\s?\\b[\\w-]*' + word.processedPhrase() + '[\\w-]*\\b\\s?', word.regexOptions());
                        }
                    }
                    else {
                        // /word/gi
                        return new RegExp(word.processedPhrase(), word.regexOptions());
                    }
                case Constants.MatchMethods.Whole:
                    // /\b[\w-]*word[\w-]*\b/gi
                    if (word.unicode) {
                        // Work around for lack of word boundary support for unicode characters
                        // (^|[\s.,'"+!?|-]*)([\S]*куче[\S]*)([\s.,'"+!?|-]*|$)/giu
                        return new RegExp('(^|' + Word._unicodeWordBoundary + '*)([\\S]*' + word.processedPhrase() + '[\\S]*)(' + Word._unicodeWordBoundary + '*|$)', word.regexOptions());
                    }
                    else if (word.hasEdgePunctuation()) { // Begin or end with punctuation (not \w))
                        return new RegExp('(^|\\s)([\\S]*' + word.processedPhrase() + '[\\S]*)(\\s|$)', word.regexOptions());
                    }
                    else {
                        return new RegExp('\\b[\\w-]*' + word.processedPhrase() + '[\\w-]*\\b', word.regexOptions());
                    }
                case Constants.MatchMethods.Regex:
                    return new RegExp(word.value, word.regexOptions());
                case Constants.MatchMethods.Exact:
                default:
                    // Match entire word that contains sub-string and surrounding whitespace
                    // /\s?\bword\b\s?/gi
                    if (word._filterMethod === Constants.FilterMethods.Remove) {
                        if (word.unicode) {
                            // Work around for lack of word boundary support for unicode characters
                            // /(^|[\s.,'"+!?|-])(word)([\s.,'"+!?|-]+|$)/giu
                            return new RegExp('(^|' + Word._unicodeWordBoundary + ')(' + word.processedPhrase() + ')(' + Word._unicodeWordBoundary + '|$)', word.regexOptions());
                        }
                        else if (word.hasEdgePunctuation()) { // Begin or end with punctuation (not \w))
                            return new RegExp('(^|\\s)(' + word.processedPhrase() + ')(\\s|$)', word.regexOptions());
                        }
                        else {
                            return new RegExp('\\s?\\b' + word.processedPhrase() + '\\b\\s?', word.regexOptions());
                        }
                    }
                    else {
                        if (word.unicode) {
                            // Work around for lack of word boundary support for unicode characters
                            // /(^|[\s.,'"+!?|-]+)(word)([\s.,'"+!?|-]+|$)/giu
                            return new RegExp('(^|' + Word._unicodeWordBoundary + '+)(' + word.processedPhrase() + ')(' + Word._unicodeWordBoundary + '+|$)', word.regexOptions());
                        }
                        else if (word.hasEdgePunctuation()) {
                            // Begin or end with punctuation (not \w))
                            return new RegExp('(^|\\s)(' + word.processedPhrase() + ')(\\s|$)', word.regexOptions());
                        }
                        else {
                            // /\bword\b/gi
                            return new RegExp('\\b' + word.processedPhrase() + '\\b', word.regexOptions());
                        }
                    }
            }
        }
        catch (e) {
            throw new Error('Failed to create RegExp for "' + word.value + '" - ' + e.name + ' ' + e.message);
        }
    }
    hasEdgePunctuation() { return Word._edgePunctuationRegExp.test(this.value); }
    processedPhrase() {
        let word = this;
        let isEscaped = word.escaped.includes('\\');
        let val = '';
        let lastCharIndex = word.escaped.length - 1;
        for (let i = 0; i < word.escaped.length; i++) {
            // If the current character is a '\', add it and then move to next character
            if (isEscaped && word.escaped[i] === '\\') {
                val += word.escaped[i];
                i++;
            }
            // Add the current character
            val += word.escaped[i];
            // Repeating characters
            // Word: /w+o+r+d+/g
            if (word.matchRepeated) {
                val += '+';
            }
            // Character separators
            // Word: /w[-_]*o[-_]*r[-_]*d*/g
            if (word.matchSeparators) {
                if (i != lastCharIndex) {
                    val += Word.separatorsRegExp;
                }
            }
        }
        return val;
    }
    regexOptions() {
        let options = 'gi';
        if (this.unicode) {
            options += 'u';
        }
        return options;
    }
}
Word._edgePunctuationRegExp = /(^[,.'"!?%$]|[,.'"!?%$]$)/;
Word._escapeRegExp = /[\/\\^$*+?.()|[\]{}]/g;
Word._unicodeRegExp = /[^\u0000-\u00ff]/;
Word._unicodeWordBoundary = '[\\s.,\'"+!?|-]';
Word.nonWordRegExp = new RegExp('^\\s*[^\\w]+\\s*$', 'g');
Word.separatorsRegExp = '[-_ ]*';
Word.whitespaceRegExp = /^\s+$/;
