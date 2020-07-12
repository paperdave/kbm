// This file
// - Interfaces with the kbm-helper binary
// - Does the shortcut detection for keyboards.

const { spawn } = require('child_process');
const { xmodmap } = require('./xmodmap-parser');
const { keys: x11keys } = require('./keys');

const path = require('path');
const EventEmitter = require('events');

const HELPER_PATH = path.join(__dirname, '../helper/kbm-helper');

// ExternalShortcutHandler works by reading raw key events and checking what keys are pressed.
class ExternalShortcutHandler extends EventEmitter {
  constructor(config, kb, device) {
    super();
    // verbose(`Starting ExternalShortcutHandler on kb${kb} on ${device}`);
    this.device = device;
    this.config = config;
    this.kb = kb;
    this.keys = new Set();

    this.process = spawn(HELPER_PATH, ['external', '/dev/input/' + device]);
    this.process.stderr.on('data', (data) => {
      const strings = data.toString().split('\n').filter(Boolean);
      strings.forEach(str => {
        if(!str.startsWith('Err')) {
          const [state, code, label] = str.split(',')
  
          if (state === 'up') {
            this.keys.delete(label);
          } else {
            this.keys.delete(label);
  
            const actionIndex = 'kb' + this.kb + '.' + [...this.keys].sort().concat(label).join('+');
            const action = this.config.keys[actionIndex];
  
            this.keys.add(label);
            this.emit('key', { kbid: this.kb, device: this.device, label, code });
  
            if (action) { 
              this.emit('action', action);
            }
          }
        }
      });
    });
    this.process.on('exit', () => {
      // console.log('!!! Kb' + this.kb + ' Ended');
    });
  }

  stop() {
    this.process.kill();
  }
}

// X11ShortcutHandler works by requesting the exact key combinations to X11.
class X11ShortcutHandler extends EventEmitter {
  constructor(config) {
    super();
    // verbose('Starting X11ShortcutHandler');
    this.config = config;

    const x11grabs = {};
    
    const modmap = xmodmap();
    const modifierNames = Object.keys(modmap);
    const modifierBitwiseMap = Object.fromEntries(
      modifierNames.map((name, i) => [name, (1<<i)])
    );

    const configCombos = Object.keys(this.config.keys).filter(x => x.startsWith('kb0')).map(x => x.substr(4));
    
    configCombos.forEach((combo) => {
      const keys = combo.split('+');
      const activatorKey = keys.pop();
      const mods = [...new Set(keys.map(key => {
        const mod = Object.keys(modmap).find(mod => modmap[mod].includes(key))
        if (mod) {
          return mod;
        } else {
          throw new Error(`${key} is not an X11 Modifier, add it to xmodmap or use a different modifier config. (kb0/X11 modifiers are much more strict, see docs)`);
        }
      }))];

      if(mods.length === 0) {
        throw new Error('At least one modifier is required for X11/kb0 key combinations, please add a modifier such as super.');
      }

      const keycode = x11keys[activatorKey];

      if(!keycode) {
        throw new Error(`Key ${activatorKey} cannot be used on an X11/kb0 keybind.`);
      }
      
      x11grabs[keycode + ' ' + mods.map(x => modifierBitwiseMap[x]).reduce((a,b) => a | b, 0)] = this.config.keys['kb0.' + combo];
    });

    const stdin = Object.keys(x11grabs).join('\n');

    this.process = spawn(HELPER_PATH, ['x11']);
    this.process.stdin.write(stdin);
    this.process.stdin.end();
    this.process.stderr.on('data', (data) => {
      const strings = data.toString().split('\n').filter(Boolean);
      strings.forEach(str => {
        if (x11grabs[str]) {
          this.emit('action', x11grabs[str]);
        }
      });
    });
    this.process.on('exit', () => {
      // console.log('!!! Kb0 Ended');
    });
  }

  stop() {
    this.process.kill();
  }
}

// keyboard 0 is always the X11 built in one, keyboards 1 and on need a device event
function createShortcutHandler(config, kb, device) {
  if (kb === 0) {
    return new X11ShortcutHandler(config);
  } else {
    return new ExternalShortcutHandler(config, kb, device);
  }
}

module.exports = {
  createShortcutHandler
};
