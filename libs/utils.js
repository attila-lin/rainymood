var fs = require('fs');

// Return User' home path.
exports.home = function() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

// Read JSON file
// if Error return blank object
exports.readJSON = function(file) {
  data = fs.readFileSync(file, 'utf8');
  return JSON.parse(data);
}


exports.print = function(message) {

}

exports.println = function(message) {

}