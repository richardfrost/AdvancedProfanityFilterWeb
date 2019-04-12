'use strict';

const fse = require('fs-extra');

console.log('Cleaning dist/ directory...');
fse.removeSync('dist/');