# html-to-object
A lightweight, dependency free parser for JavaScript that converts your native HTML code into an Array of JavaScript Objects.

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

#### removeEmptyContent (default: false)
Will remove the content of an element if the content consists only of whitespace.
```javascript
const h2o = require('html-to-object');

const results = h2o('path/to/file.html', { removeEmptyContent: true });
```

#### trimContentWhitespace (default: false)
Will do the same as `removeEmptyContent` as well as remove any leading or trailing whitespace in element contents that doesn't contain only whitespace.
```javascript
const h2o = require('html-to-object');

const results = h2o('path/to/file.html', { trimContentWhitespace: true });
```


## License
[MIT](LICENSE) © [Max Sandelin](https://github.com/themaxsandelin)
