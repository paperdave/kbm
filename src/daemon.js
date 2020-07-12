const { readDeviceMap, readKeyMap } = require('./config');
const { createCombinedShortcutHandler } = require('./shortcut-combiner');
const { runAction } = require('./action');
const { delay } = require('./util');
const net = require('net');
const fs = require('fs');

const PAUSE = 'p';
const RELOAD = 'r';

function rpcPause() {
  const connection = net.createConnection('/tmp/kbm.socket');
  connection.write(PAUSE);
  connection.end();
}
function rpcReload() {
  const connection = net.createConnection('/tmp/kbm.socket');
  connection.write(RELOAD);
  connection.end();
}

// The KBM System is just a all-in-one thing connecting all the pieces in a single API.
class KBMDaemon {
  running = false;
  handler = null;
  config = null
  devices = null;
  server = null;
  
  constructor() {}

  async initDaemon() {
    await this.loadConfig();
    await this.start();
    await this.startServer();

    process.on('exit', this.exitHandler.bind(this,{cleanup:true}));

    process.on('SIGINT', this.exitHandler.bind(this, {exit:true}));
    process.on('SIGHUP', this.exitHandler.bind(this, {exit:true}));
    process.on('SIGUSR1', this.exitHandler.bind(this, {exit:true}));
    process.on('SIGUSR2', this.exitHandler.bind(this, {exit:true}));
  }

  async startServer() {
    if(this.server) return;
    this.server = net.createServer();
    this.server.on('connection', socket => {
      socket.on('data', (chars) => {
        console.log('msg whole', chars)
        chars.toString().split('').forEach(char => {
          console.log('msg', char)
          if(char === PAUSE) {
            this.stop();
          } else if (char === RELOAD) {
            this.reload();
          }
        })
      });
    });
    this.server.listen('/tmp/kbm.socket');
  }

  async loadConfig() {
    this.config = await readKeyMap();
    this.devices = await readDeviceMap();
  }

  async reload() {
    await Promise.all([
      this.stop(),
      this.loadConfig(),
    ]);
    await this.start();
  }

  async start() {
    if (!this.config || !this.devices) await this.loadConfig();
    this.handler = await createCombinedShortcutHandler(
      this.config,
      this.devices
    );
    this.handler.on('action', (action) => {
      runAction(this.config, action);
    })
  }
  
  async stop() {
    this.handler.stop();
    // Just in case, let's delay 100 so processes can be killed.
    await delay(100);
  }

  exitHandler(options, code) {
    if (options.cleanup) {
      fs.unlinkSync('/tmp/kbm.socket');
      this.handler.stop();
      console.log();
      console.log();
    }
    if (options.exit) process.exit();
  }
}

function startDaemon() {
  const daemon = new KBMDaemon();
  daemon.initDaemon();
}

module.exports = {
  KBMDaemon,
  startDaemon,
  rpcPause,
  rpcReload
};
