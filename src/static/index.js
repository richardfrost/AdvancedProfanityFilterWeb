////
// Global Variables
let cfgFile; // = populateConfigs();
let configHolder = document.getElementById('configHolder');
let fileHolder = document.getElementById('drag-file');

function processFile(file) {
  let batchSummary = {};
  // let cfg = LocalConfig.build(cfgFile);
  // let filter = new LocalFilter(cfg);
  // filter.cfg.addWord('harry');
  // filter.prepare();
  // for (let f of files) {
  // }
}

// function generateSummaryTable(batchSummary, cfg) {
//   let tableInnerHTML = '<table class="w3-table w3-bordered"><tr class="w3-deep-purple"><th>File</th><th>Filtered Items</th></tr>';
//   Object.keys(batchSummary).sort().forEach(key => {
//     tableInnerHTML += `<tr><td>${key}</td><td><table class="w3-table w3-striped w3-border">`;
//     Object.keys(batchSummary[key]).forEach(match => {
//       tableInnerHTML += `<tr><td>${cfg.words[match].sub}</td><td class="w3-right-align">${batchSummary[key][match]}</td></tr>`;
//     });
//     tableInnerHTML += '</table>';
//   });
//   tableInnerHTML += '</table>'
//   document.getElementById('summaryContainer').innerHTML = tableInnerHTML;
// }

////
// Event Handlers
configHolder.ondragover = () => { return false; };
configHolder.ondragleave = () => { return false; };
configHolder.ondragend = () => { return false; };
configHolder.ondrop = e => {
  e.preventDefault();
  cfgFile = e.dataTransfer.files[0];
  document.getElementById('cfgName').innerText = cfgFile.name;
};

// Drag and Drop Files
fileHolder.ondragover = () => { return false; };
fileHolder.ondragleave = () => { return false; };
fileHolder.ondragend = () => { return false; };
fileHolder.ondrop = (e) => {
  e.preventDefault();
  let form = document.getElementById('configFileForm');
  let fileInput = document.getElementById('configFile');
  fileInput.value = e.dataTransfer.files[0];
  form.submit();
  return false;
};