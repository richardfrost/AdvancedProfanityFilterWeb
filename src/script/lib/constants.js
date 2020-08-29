export default class Constants {
    // Helper Functions
    static filterMethodName(id) { return this.nameById(this.FilterMethods, id); }
    static matchMethodName(id) { return this.nameById(this.MatchMethods, id); }
    static nameById(obj, id) {
        return Object.entries(obj).filter(arr => arr[1] === id)[0][0];
    }
    static orderedArray(obj) {
        let result = [];
        Object.values(obj).sort().forEach(id => { result.push(Constants.nameById(obj, id)); });
        return result;
    }
}
// Named Constants
Constants.FilterMethods = { Censor: 0, Substitute: 1, Remove: 2 };
Constants.MatchMethods = { Exact: 0, Partial: 1, Whole: 2, Regex: 3 };
Constants.MuteMethods = { Tab: 0, Video: 1 };
Constants.ShowSubtitles = { All: 0, Filtered: 1, Unfiltered: 2, None: 3 };
