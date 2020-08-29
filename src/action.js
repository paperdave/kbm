const { spawn } = require('child_process');
const { verbose } = require('./log');

function runAction(bindingConfig, action) {
  verbose('running action', action);
  const args = action.command.concat(); // clone array
  const program = args.shift() || 'bash';
  let proc;

  if (action.runBefore) action.runBefore(action);

  if (bindingConfig.functions[program]) {
    const func = bindingConfig.functions[program];
    const env = Object.fromEntries(func.args.map((name, i) => [name, args[i]]));

    const funcCliArgs = func.command.concat();
    const funcProgram = funcCliArgs.shift() || 'bash';

    proc = spawn(
      funcProgram,
      funcCliArgs,
      {
        stdio: ['pipe', 'inherit', 'inherit'],
        env: {
          ...process.env,
          ...env
        },
        detached: true
      }
    );
    if (func.data) {
      proc.stdin.write(func.data);
      proc.stdin.end();
    }
    proc.unref();
  } else {
    proc = spawn(program, args, { stdio: ['pipe', 'inherit', 'inherit'], detached: true });
    if (action.data) {
      proc.stdin.write(action.data)
      proc.stdin.end()
    }
    proc.unref();
  }

  proc.on('exit', () => {
    if (action.runAfter) action.runAfter(action);
  })
}

module.exports = { runAction };
