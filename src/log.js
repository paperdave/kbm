let verboseLogging = true;

function setVerboseLogging(v) {
  verboseLogging = !!v;
}
function verbose(...msg) {
  if (verboseLogging) console.log(...msg);
}

module.exports = { verbose, setVerboseLogging };
