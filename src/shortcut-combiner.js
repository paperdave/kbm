const { verbose } = require('./log');
const { createShortcutHandler } = require('./shortcut');
const { getInputDevices } = require('./device-reader');
const EventEmitter = require('events');

const mapObjEntries = (o, cb) => Object.fromEntries(Object.entries(o).map(cb));

// takes binding config and device map config
async function createCombinedShortcutHandler(bindingConfig, deviceConfig) {
  const emitter = new EventEmitter();

  const devices = await getInputDevices()

  const deviceEventMap = mapObjEntries(deviceConfig, ([id, keyboards]) => {
    return [
      id,
      keyboards.map(keyboard => {
        const device = devices.find(x => x.name === keyboard.device);
        return device ? device.handlers.find(x => x.startsWith('event')) : null;
      }).filter(Boolean)
    ];
  });

  const devicesRequired = [...new Set(Object.keys(bindingConfig.keys).map(x => x.split('.')[0].substr(2)))];

  // now yes, we didn't need to calculate the devices.find but it honestly doesn't
  // matter since it takes no time and only happens on load+reload.

  verbose(`devices required: ${devicesRequired.map(x => `kb${x}`).join(', ')}`);

  const handlers = devicesRequired.map((id) => {
    return (deviceEventMap[id] || []).map((event) => {
      const handler = createShortcutHandler(bindingConfig, parseInt(id), event);
      handler.on('action', (...args) => emitter.emit('action', ...args));
      handler.on('key', (...args) => emitter.emit('key', ...args));
      handler.on('err', (...args) => emitter.emit('err', ...args));
      return handler;
    })
  }).flat();
  
  emitter.stop = () => {
    handlers.forEach(x => x.stop());
  };

  return emitter;
}

async function lockAndListenAllDevices() {
  const bindingConfig = { keys: {}, alias: {}, functions: {} };
  const emitter = new EventEmitter();
  const devices = await getInputDevices();
  
  const handlers = devices.map(device => {
    const event = device.handlers.find(x => x.startsWith('event'));

    if (event) {
      const handler = createShortcutHandler(bindingConfig, device.name, event);
      handler.on('key', (...args) => emitter.emit('key', ...args));
      handler.on('err', (...args) => emitter.emit('err', ...args));
      return handler;
    } else {
      return null;
    }
  }).filter(Boolean);

  emitter.stop = () => {
    handlers.forEach(x => x.stop());
  };

  return emitter;
}

module.exports = {
  createCombinedShortcutHandler,
  lockAndListenAllDevices
};
