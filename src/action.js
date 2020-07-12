const { spawn } = require('child_process');

function runAction(bindingConfig, action) {
  const args = action.command.split(' ');
  const program = args.shift() || 'bash';

  if (bindingConfig.functions[program]) {
    const func = bindingConfig.functions[program];
    const env = Object.fromEntries(func.args.map((name, i) => [name, args[i]]));

    const funcCliArgs = func.command.split(' ');
    const funcProgram = funcCliArgs.shift() || 'bash';

    const proc = spawn(
      funcProgram,
      funcCliArgs,
      {
        stdio: ['pipe', 'inherit', 'inherit'],
        env: {
          ...process.env,
          ...env
        }
      }
    );
    if (func.data) {
      proc.stdin.write(func.data)
      proc.stdin.end()
    }
  } else {
    const process = spawn(program, args, { stdio: ['pipe', 'inherit', 'inherit'] });
    if (action.data) {
      process.stdin.write(action.data)
      process.stdin.end()
    }
  }
}

module.exports = { runAction };
