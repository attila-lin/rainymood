"use strict";

var Player = require('player');
var cluster = require('cluster');
var fs = require('fs');
var utils = require('./utils');

var removeListElement = function (list, index) {
  list = list.splice(index, 1);
}

var Rainy = module.exports = function() {
  this.version = "0.0.1";

  this.sounds   = ["rain.mp3","thunder.mp3"];
  this.playlist = [];
  this.home = utils.home();
}

Rainy.prototype.play = function(songname) {
  if (cluster.isMaster) {
    for (var i = 0; i < this.playlist.length; i++) {
      var worker = cluster.fork();
      // console.log(worker.id);
      this.playlist[i][2] = worker.id;
      var songname = this.playlist[i][1];
      worker.send(songname);
    }
  } else {

    var path = '../res/' + songname;
    var player = new Player(path);
    player.play();
    player.on("playend", function(){
      // keep playing
      player.add(path);
      player.next();
    });
  }
};

Rainy.prototype.readCommand = function () {

  if (cluster.isMaster) {
    var self = this;

    process.stdout.write("> ");
    process.stdin.setEncoding('utf8');

    process.stdin.on('readable', function() {
      var chunk = process.stdin.read();
      if (chunk !== null) {
        self.execCommand(chunk);
        process.stdout.write("> ");
      }
    });

    // process.stdin.on('end', function() {
    //   process.stdout.write('end');
    // });
  }
}

Rainy.prototype.execCommand = function(commands) {
  var self = this;

  commands = commands.replace("\n", "");
  var tokens = commands.split(" ");
  var cmd = tokens[0];

  if (cmd === "l") {
    // List All resources with a id
    var i = 1;
    for(var sound in this.sounds ) {
      console.log(i + " " + this.sounds[i]);
      i++;
    }
  } else if (cmd === "lp") {
    // List the Play list
    for (var i = 0; i < this.playlist.length; i++) {
      console.log(i + 1 + " " + this.playlist[i][1]);
    };
  } else if (cmd === "p") {
    // Play the sounds
    self.play();
  } else if (cmd === "s") {
    // Stop the sounds
    var killWorkers = function(callback) {
      for (var id in cluster.workers) {
        callback(cluster.workers[id]);
      }
    }
    killWorkers(function(worker) {
      // kill all workers
      worker.kill('SIGKILL');
    });
  } else if (cmd === "h") {
    // show Help
    self.help();
  } else if (cmd == "a") {
    // Add the resource to your mood sounds
    for(var i = 1; i < tokens.length; i++){
      var index = parseInt(tokens[i]) - 1;
      // soundlist has this index
      var sound = self.sounds[index];
      if (sound != undefined) {
        // console.log(self.playlist[self.sounds[index]]);
        var inplaylist = false;
        for (var song in self.playlist) {
          if (song[0] === sound) {
            inplaylist = true;
            break;
          }
        }
        if (!inplaylist) {
          self.playlist.push([index, sound, 0]);
        } else {
          console.log("has been added");
        }
      } else {
        console.log("no such sound");
      }
    }
  } else if (cmd == "ar") {
    for(var i = 1; i < tokens.length; i++){

    }
  } else if (cmd == "d") {
    // Delete the sound
    for(var i = 1; i < tokens.length; i++){
      var index = parseInt(tokens[i]) - 1;
      if (this.playlist[index] != undefined) {
        removeListElement(this.playlist, index);
      }
    }
  } else if (cmd == "c") {
    // Clear the playlist
    this.playlist = {};
  } else if (cmd === "q") {
    // Quit RainyMood
    console.log("Thanks for using");
    return process.exit();
  }
}



Rainy.prototype.help = function() {
  console.log('');
  console.log('RainyMood');
  console.log('');
  console.log([
    "",
    "install or update RainyMood: ",
    "$ [sudo] npm install rainymood -g",
    "",
    "Menu command",
    " h/?                           ->     show Help",
    " l                             ->     List all resources with a id",
    " lp                            ->     List the Play list",
    " a   [id]                      ->     Add the resource to your mood sounds",
    " ar  [path/to/your/resource]   ->     Add Resource to your resource library",
    " d   [id]                      ->     Delete the sound",
    " c                             ->     Clear the playlist",
    " p                             ->     Play the sounds",
    " s                             ->     Stop the sounds",
    " q                             ->     Quit RainyMood",
    ""
  ].join('\n'));
}


Rainy.prototype.init = function() {
  var self = this;

  // separate the master and workers
  if (cluster.isMaster) {
    var filename = '../libs/reslist.json';
    var json = utils.readJSON(filename);
    this.home = json.home;
    // console.log(home);
    fs.exists(self.home, function(exist) {
      if (!exist) {
        fs.mkdirSync(self.home);
      }
      return self.readCommand();
    });
  } else {
    // recive the song name and play it
    process.on('message', function(msg) {
      // the workers just play the sound
      self.play(msg);
    });
  }
};



