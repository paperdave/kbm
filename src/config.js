const fs = require('fs-extra');
const path = require('path');
const { parseConf } = require('./parser');
const { expandAliases } = require('./alias-processor');

const CONFIG_DIR = process.env.HOME + '/.config/kbm';

async function readDeviceMap() {
  try {
    return await fs.readJSON(process.env.HOME + '/.config/kbm/devices.json');
  } catch (error) {
    return {};
  }
}

async function writeDeviceMap(map) {
  await fs.ensureDir(CONFIG_DIR)
  return await fs.writeJSON(process.env.HOME + '/.config/kbm/devices.json', map, { spaces: 2 });
}

async function readKeyMap({ skipAlias } = {}) {
  try {
    const files = [
      path.join(__dirname, '../builtin.kbm'),
      ...(await fs.readdir(CONFIG_DIR)).map(x => path.join(CONFIG_DIR, x)).filter(x => x.endsWith('.kbm')).sort(),
    ];

    const contents = (
      await Promise.all(
        files.map(async(file) => {
          return (await fs.readFile(file)).toString();
        })
      )
    ).join('\n');

    if (skipAlias) {
      return parseConf(contents);
    } else {
      return expandAliases(parseConf(contents));
    }
  } catch (error) {
    console.error(error);
    return [];
  }
}

module.exports = {
  readDeviceMap,
  writeDeviceMap,
  readKeyMap
}
