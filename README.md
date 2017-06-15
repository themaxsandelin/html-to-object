# html-to-object
This is a HTML to JavaScript parser to enable "component" building in native code.

## Install
`$ npm install --save html-to-object`

## Usage
```javascript
const h2o = require('html-to-object');

const results = h2o('path/to/file.html', [options]);
```

## Options

#### targetIsFile (default: true)
In case of preloaded .html file content.
```javascript
const fs = require('fs');
const h2o = require('html-to-object');

const html = fs.readFileSync('path/to/file.html', 'utf8');
const results = h2o(html, { targetIsFile: false });
```

#### trimContentWhitespace (default: true)
Will trim any leading and or trailing whitespace in elements innerText.
```javascript
const h2o = require('html-to-object');

const results = h2o(html, { trimContentWhitespace: false });
```


## License
[MIT](LICENSE) © [Max Sandelin](https://github.com/themaxsandelin)
