'use strict';

const fs = require('fs');

function h2o (file, options) {
  options = Object.assign({
    file: true,
    trimtContentWhitespace: true
  }, options);

  const html = (options.file) ? fs.readFileSync(file, 'utf8'):file;
  const results = extractElement(html);
  return results.elements;

  function extractElement (html) {
    //  Check if the first line contains any whitespace.
    const firstElementIndex = html.indexOf('<');
    if (firstElementIndex) {
      // It's not the first char, check for whitespace.
      const firstLine = html.substring(0, firstElementIndex).replace(' ', '');
      if (firstLine === '\n') {
        // First line is whitespace, remove it.
        html = html.substring(firstElementIndex, html.length);
      }
    }

    // Check if the last line contains any whitespace.
    let lastLine = html.substring( html.lastIndexOf('>') + 1, html.length);
    if (lastLine) {
      lastLine = lastLine.replace(' ', '');
      if (lastLine === '\n') {
        html = html.substring(0, html.lastIndexOf('>') + 1);
      }
    }

    const elements = [];

    let copy = html;
    while (/(<([^>]+)>)/ig.test(copy)) {
      const elementLine = copy.substring(copy.indexOf('<'), copy.indexOf('>') + 1);
      const elementHasAttributes = (elementLine.indexOf(' ') > 1);
      const nodeEndChar = (elementHasAttributes) ? ' ':'>';
      const elementNode = elementLine.substring(elementLine.indexOf('<') + 1, elementLine.indexOf(nodeEndChar));

      const openTag = '<' + elementNode;
      const closeTag = '</' + elementNode + '>';
      const closeTags = getAllOccurrences(closeTag, copy);

      const openTagIndex = copy.indexOf(elementLine) + elementLine.length;

      const hasCloseTag = (closeTags.length > 0);
      let closeTagIndex;
      if (hasCloseTag) {
        if (closeTags.length > 1) {
          closeTags.forEach(function (index) {
            const middleHtml = copy.substring(openTagIndex, index);
            const startOcc = getAllOccurrences(openTag, middleHtml);
            const endOcc = getAllOccurrences(closeTag, middleHtml);
            if (startOcc.length === endOcc.length && !closeTagIndex) closeTagIndex = index;
          });
        } else {
          closeTagIndex = closeTags[0];
        }
      }

      const elementStart = copy.indexOf(elementLine);
      const elementEnd = (hasCloseTag) ? (closeTagIndex + closeTag.length) : openTagIndex;

      let attributes = [];
      if (elementHasAttributes) {
        const attributeString = elementLine.substring( elementLine.indexOf(openTag) + openTag.length + 1, elementLine.indexOf('>') );
        attributes = extractAttributes(attributeString);
      }

      const childHtml = copy.substring(openTagIndex, closeTagIndex);
      const parsed = extractElement(childHtml);
      const children = parsed.elements;

      const element = {
        node: elementNode,
        attributes: attributes,
        children: children,
        content: (!options.trimContentWhitespace) ? trimContentWhitespace(parsed.leftover):parsed.leftover
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
    let temp = string;
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

    const firstChar = temp.substring(0, 1);
    const lastChar = temp.substring(temp.length - 1, temp.length);
    return string.substring(string.indexOf(firstChar), string.indexOf(lastChar) + 1);
  }

  function extractAttributes (string) {
    const attributes = [];
    const re = /(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/g;
    let parts;
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
    const occurrences = [];
    let temp = string;
    while (temp.indexOf(part) > -1) {
      occurrences.push(temp.indexOf(part) + (string.length - temp.length));
      temp = temp.substring(temp.indexOf(part) + part.length, temp.length);
    }
    return occurrences;
  }
}

module.exports = h2o;
