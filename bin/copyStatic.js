'use strict';

const fse = require('fs-extra');

console.log('Copying static assets to ./dist/public folder...');
fse.copySync('./src/static', './dist/public');
fse.copySync('./src/views', './dist/views');