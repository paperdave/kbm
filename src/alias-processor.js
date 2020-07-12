const { xmodmap } = require('./xmodmap-parser');
const { verbose } = require('./log');

function expandKeyArray(config, kbid, keyArray) {

  // X11/External Aliasing works completely differently.
  //  External: register for all combinations.
  //  X11: register at least one, but check to make sure we don't add something invalid
  if(kbid === 'kb0') {
    if(keyArray.length === 0) return [[]];
    for (let i = 0; i < keyArray.length; i++) {
      const aliases = []
        .concat(...(config.aliases[kbid + '.' + keyArray[i]] || []))
        .concat(...(config.aliases['kb*.' + keyArray[i]] || []));
  
      if (aliases.length > 0) {
        // if it is a modifier, then we have to do extra work
        if (i < keyArray.length - 1) {
          const modmap = Object.entries(xmodmap());
          
          return aliases
            .filter(alias => modmap.find(([name, modifiers] ) => !!modifiers.find(x => alias === x)))
            .map(actualKey =>
              expandKeyArray(config, kbid, keyArray.slice(i+1))
                .map(endings => 
                  keyArray.slice(0, i)
                    .concat(actualKey)
                    .concat(
                      ...endings
                  )
                )
              ).flat()
        } else {
          return aliases
            .map(actualKey =>
              keyArray
                .slice(0, i)
                .concat(actualKey)
            );
        }
      }
    }
    return [keyArray];
  } else {
    if(keyArray.length === 0) return [[]];
    for (let i = 0; i < keyArray.length; i++) {
      const aliases = []
        .concat(...(config.aliases[kbid + '.' + keyArray[i]] || []))
        .concat(...(config.aliases['kb*.' + keyArray[i]] || []));
  
      if (aliases.length > 0) {
        return aliases
          .map(actualKey =>
            expandKeyArray(config, kbid, keyArray.slice(i+1))
              .map(endings => 
                keyArray.slice(0, i)
                  .concat(actualKey)
                  .concat(
                    ...endings
                )
              )
            ).flat()
      }
    }
    return [keyArray];
  }
}

function expandAliases(config) {
  const newKeys = {};
  const keys = Object.keys(config.keys);

  keys.forEach((key) => {
    const [kb, combo] = key.split('.');
    const comboKeys = combo.split('+');
    const action = config.keys[key];

    expandKeyArray(config, kb, comboKeys).forEach(expansion => {
      newKeys[kb + '.' + expansion.join('+')] = action;
    });
  });

  return {
    ...config,
    keys: newKeys
  }
}

module.exports = { expandAliases };
