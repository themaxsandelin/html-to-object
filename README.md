# html-to-object
This is a HTML to JavaScript parser to enable "component" building in native code.

## Install
`$ npm install --save html-to-object`

## Usage
```javascript
// Simplest usage.
const h2o = require('html-to-object');

const results = h2o('path/to/file.html');
```

## API

### h2o(target, [options])
#### options
See examples below.

## file (default: true)
```javascript
// In case of preloaded .html file content
const fs = require('fs');
const h2o = require('html-to-object');

const html = fs.readFileSync('path/to/file.html', 'utf8');
const results = h2o(html, { file: false });
```

## contentWhitespace (default: true)
```javascript
// Will trim any leading or trailing whitespace in elements innerText.
const h2o = require('html-to-object');

const results = h2o(html, { contentWhitespace: false });
```


## License
[MIT](LICENSE) © [Max Sandelin](https://github.com/themaxsandelin)
