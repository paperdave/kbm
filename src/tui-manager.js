// require this file to start the manager
const chalk = require('chalk');
const inquirer = require('inquirer');
const { readDeviceMap, writeDeviceMap } = require('./config');
const { lockAndListenAllDevices } = require('./shortcut-combiner');
const { delay } = require('./util');

async function manager() {
  const config = await readDeviceMap();

  while(true) {
    console.clear();
    console.log('KBM Keyboard Manager');
    console.log();
    const list = Object.keys(config).map((x) => config[x].map((y, i) => ({ name: `kb${x} - ${y.label}`, value: [x, i] }))).flat();
    let kb = (await inquirer.prompt({
      type: 'rawlist',
      message: list.length === 0 ? 'No Keyboards Added... ' + chalk.italic('Yet!') : 'Edit a keyboard.',
      name: 'kb',
      choices: [
        ...list.length === 0 ? [] : [...list, new inquirer.Separator()],
        { name: 'Add New' },
        { name: 'Exit' },
      ]
    })).kb;
    if(kb === 'Exit') {
      console.clear();
      process.exit();
    } else if(kb === 'Add New') {
      console.log();
      console.log('Adding a Keyboard');
      while(await new Promise(async(done) => {
          await delay(250);
          const handler = await lockAndListenAllDevices();

          console.log('Press any key on any keyboard to add it.');

          handler.on('key', async(ev) => {
            await delay(200);

            console.log(`You pressed ${ev.label} on ${ev.kbid}. Good Job.`);
            console.log();
            handler.stop();

            const find = Object.keys(config).find(x => config[x].find(y => y.device === ev.kbid));
            if (find) {
              console.log();
              console.log(`It is already added on channel kb${find}.`);
              console.log();
              await delay(1750);
              done(true);
            } else {
              let { ok } = await inquirer.prompt(
                {
                  type: 'confirm',
                  message: 'Is this the correct keyboard?',
                  name: 'ok',
                  default: true
                }
              );
              if (!ok) {
                let { restart } = await inquirer.prompt(
                  {
                    type: 'confirm',
                    message: 'Retry Keyboard?',
                    name: 'ok',
                    default: false
                  }
                );
                done(restart);
              }
              let { label } = await inquirer.prompt(
                {
                  type: 'input',
                  message: 'Enter a label for this keyboard.',
                  name: 'label',
                  default: ev.kbid
                }
              );
              let { channel } = await inquirer.prompt([
                {
                  type: 'number',
                  message: 'What keyboard channel should this keyboard go on.',
                  name: 'channel',
                  default: 1,
                  validate(x) {
                    if (x > 0) {
                      return true;
                    } else {
                      return false;
                    }
                  }
                }
              ])
              config[channel] = (config[channel] || []).concat({ label, device: ev.kbid });
              writeDeviceMap(config);
              console.log('Added.');
              console.log('');
              done();
            }
          });
        })
      ){};
    } else {
      const entry = config[kb[0]][kb[1]];
      let loop = true;
      while(loop) {
        console.clear();
        console.log('KBM Keyboard Manager');
        console.log();
        const {action} = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'Viewing Keyboard Properties',
            choices: [
              { short: 'Back', name: 'Back', value: 'exit' },
              new inquirer.Separator(),
              { short: 'Scan New KB', name: 'Keyboard: ' + chalk.greenBright(entry.device), value: 'device' },
              { short: 'Edit Label', name: 'Label: ' + chalk.greenBright(entry.label), value: 'label' },
              { short: 'Edit Channel', name: 'Channel: ' + chalk.greenBright('kb' + kb[0]), value: 'channel' },
            ]
          }
        ]);
        if (action === 'exit') {
          loop = false;
        } else if (action === 'channel') {
          const { v } = await inquirer.prompt([
            {
              type: 'number',
              name: 'v',
              message: 'Set keyboard channel',
              default: kb[0],
              validate(x) {
                if (x > 0) {
                  return true;
                } else {
                  return false;
                }
              }
            }
          ]);
          if (v !== kb[0]) {
            config[kb[0]] = config[kb[0]].filter(x => x !== entry);
            config[v] = (config[v] || []).concat(entry);
            kb[0] = v;
            writeDeviceMap(config);
          }
        } else if (action === 'label') {
          const { v } = await inquirer.prompt([
            {
              type: 'input',
              name: 'v',
              message: 'Set keyboard label',
              default: entry.label
            }
          ]);
          entry.label = v;
          writeDeviceMap(config);
        } else if (action === 'device') {
          console.log();
          while(await new Promise(async(done) => {
            await delay(250);
            const handler = await lockAndListenAllDevices();

            console.log('Press any key on the keyboard you want to use.');

            handler.on('key', async(ev) => {
              await delay(200);

              console.log(`You pressed ${ev.label} on ${ev.kbid}. Good Job.`);
              console.log();
              handler.stop();

              const find = Object.keys(config).find(x => config[x].find(y => y.device === ev.kbid));
              if(find === entry) {
                console.log('-_- you kept the same keyboard. ok.');
                console.log();
                done();
              } else {
                entry.device = ev.kbid;
                writeDeviceMap(config);
                done();
              }
            });
          })){};
        }
      }
    }
  }
}

manager();
