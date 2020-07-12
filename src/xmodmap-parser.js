const { execSync } = require('child_process');

const mappings = {
  shift_l: 'shift_left',
  shift_r: 'shift_right',
  control_l: 'control_left',
  control_r: 'control_right',
  hyper_l: 'hyper_left',
  hyper_r: 'hyper_right',
  super_l: 'super_left',
  super_r: 'super_right',
  multi_key: 'compose',
  alt_l: 'alt_left',
  alt_right: 'alt_right',
}

// ''parses'' a line like
//    shift       Shift_L (0x32),  Shift_R (0x3e)
function parseLine(line) {
  const split = line.replace(/  +/g, ' ')
    .split(' ');
  const parsed = split
    .slice(1)
    .filter((x,i) => i % 2 === 0)
    .map(x => x.toLowerCase())
    .map(x => mappings[x]);
  if (parsed[0] === '') return [split[0]];
  return parsed.concat(split[0]);
}

let cache;

function xmodmap() {
  if(cache) return cache;
  const output = execSync('xmodmap').toString();
  const lines = output.split('\n');
  
  cache = {
    shift: parseLine(lines[2]),
    lock: parseLine(lines[3]),
    control: parseLine(lines[4]),
    mod1: parseLine(lines[5]),
    mod2: parseLine(lines[6]),
    mod3: parseLine(lines[7]),
    mod4: parseLine(lines[8]),
    mod5: parseLine(lines[9]),
  };
  return cache;
}

function refresh() {
  cache = false;
  return xmodmap();
}

module.exports = {
  xmodmap,
  refresh
}
