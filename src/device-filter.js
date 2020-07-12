// handle filtering out things like "Power Button" from the keyboard listing

// things that appear as keyboards, but aren't really useful / or actually keyboards
// so we will exclude these in our keyboard search.
const keyboardExclusions = [
  /^Sleep Button$/,
  /^Power Button$/,
  /System Control/,
  /Consumer Control/,
  /Webcam/,
  /^Video Bus$/,
];

function isKeyboardNameExcluded(name) {
  return keyboardExclusions.find(regex => regex.exec(name));
}

module.exports = {
  keyboardExclusions,
  isKeyboardNameExcluded,
};
