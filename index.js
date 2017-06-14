'use strict';

var fs = require('fs');

function h2o (file, options) {
  options = Object.assign({
    file: true,
    contentWhitespace: true
  }, options);

  var html = (options.file) ? fs.readFileSync(file, 'utf8'):file;
  var results = extractElement(html);
  return results.elements;

  function extractElement (html) {
    //  Check if the first line contains any whitespace.
    var firstElementIndex = html.indexOf('<');
    if (firstElementIndex) {
      // It's not the first char, check for whitespace.
      var firstLine = html.substring(0, firstElementIndex).replace(' ', '');
      if (firstLine === '\n') {
        // First line is whitespace, remove it.
        html = html.substring(firstElementIndex, html.length);
      }
    }

    // Check if the last line contains any whitespace.
    var lastLine = html.substring( html.lastIndexOf('>') + 1, html.length);
    if (lastLine) {
      lastLine = lastLine.replace(' ', '');
      if (lastLine === '\n') {
        html = html.substring(0, html.lastIndexOf('>') + 1);
      }
    }

    var elements = [];

    var copy = html;
    while (/(<([^>]+)>)/ig.test(copy)) {
      var elementLine = copy.substring(copy.indexOf('<'), copy.indexOf('>') + 1);
      var elementHasAttributes = (elementLine.indexOf(' ') > 1);
      var nodeEndChar = (elementHasAttributes) ? ' ':'>';
      var elementNode = elementLine.substring(elementLine.indexOf('<') + 1, elementLine.indexOf(nodeEndChar));

      var openTag = '<' + elementNode;
      var closeTag = '</' + elementNode + '>';
      var closeTags = getAllOccurrences(closeTag, copy);

      var openTagIndex = copy.indexOf(elementLine) + elementLine.length;

      var hasCloseTag = (closeTags.length > 0);
      var closeTagIndex;
      if (hasCloseTag) {
        if (closeTags.length > 1) {
          closeTags.forEach(function (index) {
            var middleHtml = copy.substring(openTagIndex, index);
            var startOcc = getAllOccurrences(openTag, middleHtml);
            var endOcc = getAllOccurrences(closeTag, middleHtml);
            if (startOcc.length === endOcc.length && !closeTagIndex) closeTagIndex = index;
          });
        } else {
          closeTagIndex = closeTags[0];
        }
      }

      var elementStart = copy.indexOf(elementLine);
      var elementEnd = (hasCloseTag) ? (closeTagIndex + closeTag.length) : openTagIndex;

      var attributes = [];
      if (elementHasAttributes) {
        var attributeString = elementLine.substring( elementLine.indexOf(openTag) + openTag.length + 1, elementLine.indexOf('>') );
        attributes = extractAttributes(attributeString);
      }

      var childHtml = copy.substring(openTagIndex, closeTagIndex);
      var parsed = extractElement(childHtml);
      var children = parsed.elements;

      var element = {
        node: elementNode,
        attributes: attributes,
        children: children,
        content: (!options.contentWhitespace) ? trimContentWhitespace(parsed.leftover):parsed.leftover
      }

      elements.push(element);
      copy = copy.substring(0, elementStart) + copy.substring(elementEnd, copy.length);
    }

    return {
      elements: elements,
      leftover: copy
    };
  }

  function trimContentWhitespace (string) {
    var temp = string;
    // Remove linebreaks
    while (temp.indexOf('\n') > -1) {
      temp = temp.replace('\n', '');
    }
    // Remove spaces
    while (temp.indexOf(' ') > -1) {
      temp = temp.replace(' ', '');
    }
    // If there were just linebreaks and spaces, just remove them outright.
    if (!temp) return '';

    var firstChar = temp.substring(0, 1);
    var lastChar = temp.substring(temp.length - 1, temp.length);
    return string.substring(string.indexOf(firstChar), string.indexOf(lastChar) + 1);
  }

  function extractAttributes (string) {
    var attributes = [];
    var re = /(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/g;
    var parts;
    do {
      parts = re.exec(string);
      if (parts) {
        attributes.push({
          name: parts[1],
          value: parts[2]
        });
      }
    } while (parts);
    return attributes;
  }

  function getAllOccurrences (part, string) {
    var occurrences = [];
    var temp = string;
    while (temp.indexOf(part) > -1) {
      occurrences.push(temp.indexOf(part) + (string.length - temp.length));
      temp = temp.substring(temp.indexOf(part) + part.length, temp.length);
    }
    return occurrences;
  }
}

module.exports = h2o;
