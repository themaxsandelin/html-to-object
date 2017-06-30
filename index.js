const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;


function h2o (target, options) {
  options = Object.assign({
    build: false,
    targetIsFile: true,
    attributesAsObject: false
  }, options);

  let document;
  if (options.build) {
    document = new JSDOM().window.document;
  }

  const voids = [
    'area',
    'base',
    'basefont',
    'bgsound',
    'br',
    'col',
    'command',
    'embed',
    'frame',
    'hr',
    'image',
    'img',
    'input',
    'isindex',
    'keygen',
    'link',
    'menuitem',
    'meta',
    'nextid',
    'param',
    'source',
    'track',
    'wbr'
  ];
  const openTags = [];
  const closeTags = [];

  const html = (options.targetIsFile) ? fs.readFileSync(target, 'utf8'):target;

  // Break out all HTML tags.
  let temp = html;
  while ((temp.indexOf('<') > -1) && (temp.indexOf('>') > -1)) {
    const diff = html.length - temp.length;

    const start = temp.indexOf('<');
    const end = temp.indexOf('>') + 1;
    const nodeString = temp.substring(start, end);
    const isCloseTag = (nodeString.indexOf('/') === 1);

    const obj = {
      startIndex: start + diff,
      endIndex: end + diff,
      nodeString: nodeString
    }

    if (isCloseTag) {
      closeTags.push(obj);
    } else {
      openTags.push(obj);
    }
    temp = temp.substring(end, temp.length);
  }

  let elements = [];
  openTags.forEach((open, i) => {
    const node = parseNodeString(open.nodeString);
    const isVoid = (voids.indexOf(node.nodeName) > -1);

    let close;
    if (!isVoid) {
      close = findCloseTag(node.nodeName, open.endIndex);
    }

    elements.push({
      type: 'element',
      node: node.nodeName,
      attributes: node.attributes,
      void: isVoid,
      children: [],
      parentIndex: -1,
      index: {
        elementStart: open.startIndex,
        elementEnd: (isVoid) ? open.endIndex:close.endIndex,
        contentStart: open.endIndex,
        contentEnd: (isVoid) ? open.endIndex:close.startIndex
      }
    });
  });

  elements.forEach((main, x) => {
    elements[x].id = x;
    elements.forEach((sub, y) => {
      if (sub.index.elementStart >= main.index.contentStart && sub.index.elementStart < main.index.contentEnd) {
        elements[y].parentIndex = x;
      }
    });
  });

  const purge = [];
  elements.forEach((element, i) => {
    if (element.parentIndex > -1) {
      elements[element.parentIndex].children.push(element);
      purge.push(i);
    }
  });

  purge.forEach((x) => {
    elements.forEach((element, y) => {
      if (element.id === x) {
        elements.splice(y, 1);
      }
    });
  });

  elements.forEach((element) => {
    if (!element.void) parseElementContent(element, html);
    if (element.children.length) {
      orderElementChildren(element);
    }
    cleanElement(element);
  });

  return (options.build) ? constructElements(elements):elements;

  function cleanElement (element) {
    delete element.parentIndex;
    delete element.index;
    delete element.id;
    delete element.void;
    if (element.children) {
      element.children.forEach((child) => {
        cleanElement(child);
      });
    }
  }

  function orderElementChildren (element) {
    element.children.sort((a, b) => {
      if (a.index.elementStart > b.index.elementStart) return 1;
      if (a.index.elementStart < b.index.elementStart) return -1;
      return 0;
    });
    element.children.forEach((child) => {
      if (child.children) orderElementChildren(child);
    });
  }

  function parseElementContent (element, html) {
    let content = html.substring(element.index.contentStart, element.index.contentEnd);

    const lines = [];
    let diff = element.index.contentStart;
    if (element.children.length) {
      element.children.forEach((child, i) => {
        parseElementContent(child, html);
        lines.push({
          text: content.substring(0, (child.index.elementStart - diff)),
          index: diff
        });
        content = content.substring((child.index.elementEnd - diff), content.length);
        diff += (child.index.elementStart - diff);
        diff += (child.index.elementEnd - child.index.elementStart);
      });
    }
    lines.push({
      text: content,
      index: diff
    });

    content = html.substring(element.index.contentStart, element.index.contentEnd);
    lines.forEach((line) => {
      line.text = trimWhitespace(line.text);
      if (line.text) {
        element.children.push({
          type: 'text',
          text: line.text,
          index: {
            elementStart: line.index
          }
        });
      }
    });
  }

  function trimWhitespace (string) {
    // Remove linebreaks
    while (string.indexOf('\n') > -1) {
      string = string.replace('\n', '');
    }
    // Remove tabs
    while (string.indexOf('\t') > -1) {
      string = string.replace('\t', '');
    }
    // Find first and last char and remove leading and trailing whitespace.
    let temp = string;
    while (temp.indexOf(' ') > -1) {
      temp = temp.replace(' ', '');
    }
    if (!temp) return '';

    const firstChar = temp.substring(0, 1);
    const lastChar = temp.substring(temp.length - 1, temp.length);

    return string.substring(string.indexOf(firstChar), string.lastIndexOf(lastChar) + 1);
  }

  function findCloseTag (nodeName, openIndex) {
    const otaga = '<' + nodeName + ' ';
    const otagb = '<' + nodeName + '>';
    const ctag = '</' + nodeName + '>';
    const closes = [];

    let closeTag;
    closeTags.forEach((close, i) => {
      if (!closeTag && close.nodeString === ctag && close.startIndex >= openIndex) {
        const opens = [];
        openTags.forEach((open) => {
          if (open.startIndex > openIndex && ((open.nodeString.indexOf(otaga) > -1) || (open.nodeString.indexOf(otagb) > -1)) && open.startIndex < close.startIndex) {
            opens.push(open);
          }
        });
        if (closes.length === opens.length) closeTag = close;
        closes.push(close);
      }
    });
    return closeTag;
  }

  function parseNodeString (string) {
    const hasAttributes = (string.indexOf(' ') > -1);
    const nodeName = string.substring(1, ((hasAttributes) ? string.indexOf(' '):string.length - 1));

    string = string.replace('<', '').replace('>', '').replace(nodeName, '');
    if (string.indexOf(' ') === 0) string = string.substring(1, string.length);
    if (string.lastIndexOf(' ') === (string.length - 1)) string = string.substring(0, string.length - 1);

    const attributes = (options.attributesAsObject) ? {}:[];
    if (hasAttributes) {
      const re = /(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/g;
      let parts;
      do {
        parts = re.exec(string);
        if (parts) {
          if (options.attributesAsObject) {
            attributes[parts[1]] = parts[2];
          } else {
            attributes.push({
              name: parts[1],
              value: parts[2]
            });
          }
        }
      } while (parts);

      if (options.attributesAsObject) {
        Object.keys(attributes).forEach((key) => {
          const val = key + '="' + attributes[key] + '"';
          string = string.replace(val, '');
        });
      } else {
        attributes.forEach((attr) => {
          const val = attr.name + '="' + attr.value + '"';
          string = string.replace(val, '');
        });
      }

      const potentialAttributes = string.split(' ');
      potentialAttributes.forEach((pa) => {
        if (pa) {
          if (options.attributesAsObject) {
            attributes[pa] = true;
          } else {
            attributes.push({
              name: pa,
              value: true
            });
          }
        }
      });
    }

    return {
      nodeName: nodeName,
      attributes: attributes
    };
  }

  function constructElements (elements, parent) {
    const build = [];
    elements.forEach((element) => {
      let el = buildElement(elements[0], parent);
      if (!parent) {
        build.push(el);
      }
    });
    return build;

    function buildElement (obj, parent) {
      let el;
      if (obj.type === 'text') {
        el = document.createTextNode(obj.text);
      } else {
        el = document.createElement(obj.node);
        if (obj.attributes && obj.attributes.length) {
          obj.attributes.forEach((attribute) => {
            el.setAttribute(attribute.name, attribute.value);
          });
        }
        if (obj.children && obj.children.length) {
          obj.children.forEach((child) => {
            buildElement(child, el);
          });
        }
      }
      if (!parent) return el;
      parent.appendChild(el);
    }
  }
}

module.exports = h2o;
