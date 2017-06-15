const h2o = require('../index.js');
const res = h2o('test/test.html', { removeEmptyContent: true });

console.dir(res[0].children);
