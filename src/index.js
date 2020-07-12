#!/usr/bin/node
const yargs = require('yargs');

const { getKeyboardDevices, getInputDevices } = require('./device-reader');
const { readDeviceMap, readKeyMap } = require('./config');
const { createShortcutHandler } = require('./shortcut');

yargs
  .scriptName("kbm")
  .usage('$0 <cmd> [args]')
  .command('daemon', 'Run the background daemon.', () => require('./daemon').startDaemon())
  .command('config', 'Show the keyboard manager tui.', () => require('./tui-manager'))
  .command('debug', 'Debug', (yargs) => {
    yargs
      .usage('$0 debug <cmd> [args]')
      .command('dump-kb', 'Dump the keyboard list.', async() => console.log((await getKeyboardDevices()).map(x => `${x.name} (${x.handlers.find(x=>x.startsWith('event'))})`).join('\n')))
      .command('dump-kb-all', 'Dump the input device list.', async() => console.log((await getInputDevices()).map(x => `${x.name} (${x.handlers.find(x=>x.startsWith('event'))})`).join('\n')))
      .command('dump-config', 'Dump devices.json', async() => console.log(await readDeviceMap()))
      .command('dump-keys-noalias', 'Dump parsed key.json', async() => console.log(await readKeyMap()))
      .command('dump-keys', 'Dump parsed key.json', async() => console.log(await readKeyMap()))
      .command(
        'read-keys [event]', 'Run a key reader on the given event name.',
        (y) => y.positional('event', { description: 'event name to run on' }),
        async(x) => {
          const handler = createShortcutHandler({ keys: {}, functions: {} }, 1, x.event);
          handler.on('key', (key) => {
            console.log(`Press ${key.label} (code ${key.code})`);
          });
        })
      .demandCommand(1)
      .help()
  }, () => {})
  .demandCommand(1)
  .help()
  .argv;
