// reads input devices / filters out keyboards via /proc/stuff
const fs = require('fs-extra');
const fromEntries = require('fromentries'); // [polyfill for Object.fromEntries]
const { capitalize } = require('@reverse/string');

const { isKeyboardNameExcluded } = require('./device-filter');

const inputBusFile = '/proc/bus/input/devices';
const inputBusLineRegex = /^([A-Z]): ?(.*?)=(.*)$/; // example: "N: HANDLERS=key event25"

async function getInputDevices() {
  // read the file
  const string = (await fs.readFile(inputBusFile)).toString();

  const devices = string
  // split on double newline
    .split('\n\n')
  // remove last
    .slice(0, -1)
  // process each
    .map(entry => {
      return fromEntries(
        entry
          // split newline
          .split('\n')
          // process each to a key value pair
          .map(line => {
            if(line.startsWith('I')) {
              // the I (i think info) has many things on one line. why? i have no idea.
              return [
                'info',
                fromEntries(
                  line
                    // remove 'I: '
                    .substr(3)
                    // split by space
                    .split(' ')
                    .map((part) => {
                      const split = part.split('=');
                      return [split[0].toLowerCase(), split[1]]
                    })
                )
              ];
            }
            const match = inputBusLineRegex.exec(line);
            if (match[1] === 'B') {
              return ['b' + capitalize(match[2].toLowerCase()), match[3]];
            } else {
              if(match[2] === 'Handlers') {
                match[3] = match[3].split(' ').slice(0, -1);
              }
              if(match[2] === 'Name') {
                match[3] = match[3].slice(1, -1);
              }
              return [match[2].toLowerCase(), match[3]];
            }
          })
      );
    });
  return devices;
}

function isKeyboardDevice(device) {
  return device.handlers.includes('kbd') && !isKeyboardNameExcluded(device.name);
}

async function getKeyboardDevices() {
  return (await getInputDevices()).filter(isKeyboardDevice);
}

module.exports = {
  getInputDevices,
  getKeyboardDevices,
  isKeyboardDevice,
};
