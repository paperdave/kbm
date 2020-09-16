#!/usr/bin/node
const yargs = require('yargs');
const util = require('util');

const { getKeyboardDevices, getInputDevices } = require('./device-reader');
const { readDeviceMap, readKeyMap } = require('./config');
const { createShortcutHandler } = require('./shortcut');
const { setVerboseLogging } = require('./log');

setVerboseLogging(false);

yargs
  .scriptName("kbm")
  .usage('$0 <cmd> [args]')
  .option('verbose', { desc: 'Enable Verbose Logging.'} )
  .alias('v', 'verbose')

if (yargs.argv.v) {
  setVerboseLogging(true);
}

yargs
  .command('daemon', 'Run the background daemon.', () => require('./daemon').startDaemon())
  .command('reload', 'Reload the background daemon.', () => require('./daemon').rpcReload())
  .command('config', 'Show the keyboard manager tui.', () => require('./tui-manager'))
  .command('debug', 'Debug', (yargs) => {
    yargs
      .usage('$0 debug <cmd> [args]')
      .command('dump-kb', 'Dump the keyboard list.', async() => console.log(util.inspect((await getKeyboardDevices()).map(x => `${x.name} (${x.handlers.find(x=>x.startsWith('event'))})`).join('\n'),false,100,true)))
      .command('dump-kb-all', 'Dump the input device list.', async() => console.log(util.inspect((await getInputDevices()).map(x => `${x.name} (${x.handlers.find(x=>x.startsWith('event'))})`).join('\n'),false,100,true)))
      .command('dump-config', 'Dump devices.json', async() => console.log(util.inspect(await readDeviceMap(),false,100,true)))
      .command('dump-keys-noalias', 'Dump parsed key.json', async() => console.log(util.inspect(await readKeyMap(),false,100,true)))
      .command('dump-keys', 'Dump parsed key.json', async() => console.log(util.inspect(await readKeyMap(),false,100,true)))
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
