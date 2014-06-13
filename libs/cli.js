var Rainy = require('./rainy');

module.exports = function() {
  var rainy = new Rainy();
  var command = process.argv[2];
  if (!command) return rainy.init();
  if (command === "help" || command === "h") {
    rainy.help();
  }
}

