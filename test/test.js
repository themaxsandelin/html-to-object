const h2o = require('../index.js');
const res = h2o('test/test.html', { trimContentWhitespace: true });

console.log(res);
