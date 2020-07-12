const verboseLogging = true;

function verbose(...msg) {
  if (verboseLogging) console.log(...msg);
}

module.exports = { verbose };
