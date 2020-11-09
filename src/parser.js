const { keyList } = require('./keys');
const trim = require('trim-lines2');

const REGEX_COMMENT = /^\s*(#|\/\/).*$/;
const REGEX_FUNCTION = /^\s*(sync\s+)?function\s+([a-zA-Z_+-0-9][a-zA-Z0-9_\.+-]*)\s*\(([a-zA-Z_+0-9-][a-zA-Z0-9_\.+,\s-]*?)?\)?\s*:\s*(.*)/;
const REGEX_KB = /^\s*kb([0-9]+)\s*@\s*([^:]+?)\s*:\s*(sync\s+)?(.*)$/;
const REGEX_ALIAS = /^\s*alias\s+kb(\*|[0-9]+)\s+([a-zA-Z_0-9][a-zA-Z0-9_]*)\s*=\s*([a-zA-Z_0-9][a-zA-Z0-9_]*)\s*$/;
const REGEX_BLOCK_END = /^(.*)}\s*$/;

function parseCombo(str) {
  const arr = str.split('+').map(x => x.trim());
  const item = arr.pop();
  return arr.sort().concat(item);
}
function parseArgs(str) {
  return str.split(',').map(x => x.trim());
}
function parseCommandArgs(str) {
  // This is an edge case / builtin
  if(str.trim().startsWith('$')) {
    return [
      'bash',
      '-c',
      str.trim().slice(2).trim(),
    ]
  }

  const args = [];
  let currentArg = null;
  let inString = null;
  let backSlashCount = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] !== '\\') backSlashCount = 0
    if (str[i] === '\\') backSlashCount ++;

    if(backSlashCount % 2 === 0) {
      if (str[i] === ' ' || str[i] === '\t') {    
        if (inString !== null) {
          if(!currentArg) currentArg = '';
          currentArg += str[i]
        } else if (currentArg !== null) {
          args.push(currentArg);
          currentArg = null;
        }
      } else if (inString === null && str[i] === '"' || str[i] === "'") {
        inString = str[i];
      } else if (inString !== null && str[i] === inString ) {
        inString = null;
      } else {
        if(!currentArg) currentArg = '';
        currentArg += str[i];
      }
    }
  }
  if(currentArg !== null) {
    args.push(currentArg);
  }
  return args;
}

function parseConf(str) {
  const functions = {};
  const aliases = {};
  const keys = {};

  const lines = str.split('\n');

  let insideBlock = false;
  let functionData = null;
  let keybindData = null;
  let blockData = null;
  
  let brackets = 0;

  for (let i = 0; i < lines.length; i++) {
    const element = lines[i];

    if(!insideBlock) {
      let match;
      if (match = REGEX_COMMENT.exec(element)) {
        // do literally nothing
      } else if (match = REGEX_ALIAS.exec(element)) {
        let newKey = [match[3]];
        if (!keyList.includes(newKey[0])) {
          if (aliases['kb' + match[1] + '.' + newKey[0]]) {
            newKey = aliases['kb' + match[1] + '.' + newKey[0]]
          } else {
            throw new Error('Cannot find key ' + newKey[0]);
          }
        }
        aliases['kb' + match[1] + '.' + match[2]] = [...new Set((aliases['kb' + match[1] + '.' + match[2]] || []).concat(...newKey))];
      } else if (match = REGEX_FUNCTION.exec(element)) {
        if (element.trim().endsWith('{')) {
          brackets = 1;
          insideBlock = 'function';
          functionData = {
            name: match[2],
            args: parseArgs(match[3]),
            sync: !!match[1],
            command: parseCommandArgs(match[4].slice(0, -1).trim())
          };
          blockData = '';
        } else {
          functions[match[1]] = {
            sync: !!match[1],
            args: parseArgs(match[3]),
            command: parseCommandArgs(match[4]),
          }
        }
      } else if (match = REGEX_KB.exec(element)) {
        if (element.trim().endsWith('{')) {
          brackets = 1;
          insideBlock = 'keybind';
          keybindData = {
            kb: parseInt(match[1]),
            combo: parseCombo(match[2]),
            sync: !!match[3],
            command: parseCommandArgs(match[4].slice(0, -1))
          };
          blockData = '';
        } else {
          keys['kb' + parseInt(match[1]) + '.' + parseCombo(match[2]).join('+')] = {
            sync: !!match[3],
            command: parseCommandArgs(match[4].trim())
          }
        }
      } else {
        console.log("Couldn't Match " + element)
      }
    } else {
      // do the thing
      brackets += (element.match(/{/g) || []).length - (element.match(/}/g) || []).length;

      if(brackets < 0) {
        throw new Error('Unmatched closing bracket.');
      } else if (brackets === 0) {
        let match;
        if (match = REGEX_BLOCK_END.exec(element)) {
          blockData += match[1] + '\n';
          blockData = trim(blockData);
          if (insideBlock === 'function') {
            functions[functionData.name] = {
              command: functionData.command,
              args: functionData.args,
              data: blockData,
            }
          } else {
            keys['kb' + keybindData.kb + '.' + keybindData.combo.join('+')] = {
              command: keybindData.command,
              data: blockData
            }
          }
          insideBlock = false;
        } else {
          throw new Error('Invalid text after closing bracket.');
        }
      } else {
        blockData += element + '\n';
      }
    }
  }

  if (insideBlock) {
    throw new Error('Block not closed.');
  }

  return {
    functions,
    keys,
    aliases
  };
}

module.exports = {
  parseConf
};
