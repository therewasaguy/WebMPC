var mode = 'play';
var modeButton, setButton; 
var colorPalette;
var mic;
var recorder;

var drumpad = function( sketch ) {
  var sample;
  var cnv;
  var bgColor = [ random(0,255), random(0,255), random(0,255) ];
  var recording = false;
  var recTime = 0;
  var amp = new Amplitude();

  sketch.setup = function() {
    cnv = sketch.createCanvas(400, 400);
    cnv.mousePressed(sketch.pressed);
    sketch.background(sketch.random(0,255));
  };

  sketch.draw = function() {
    if (mode === 'play'){
      if (sample && !sample.isPlaying()){
        sketch.background(bgColor);
      }
      else if (sample && sample.isPlaying()) {
        // set background color based on track volume
        sketch.background(bgColor)
        if (amp.getLevel() > .00) {
          var alpha = floor(map(amp.getLevel(), 0, .2, 10, 255));
          alpha = constrain(alpha, 0,255);
          sketch.background(255,255,0, alpha);
          console.log(alpha);
        }

      }
    } else if (mode === 'rec') {
      if (recording) {
        sketch.text('Recording!' + recTime);
      } else {
        sketch.background(bgColor);
      }
    }
  };

  sketch.pressed = function() {
    if (mode === 'play') {
      sample.play();
    } else if (mode === 'rec') {
      if (recording === false) {
        sketch.background(255,0,0);
        recording = true;
        recorder = new Recorder(mic);
        if (mic.getLevel() > .00) {
          recorder.record();
          console.log('recording!');
        }
      } else {
        recording = false;
        recorder.stop();
        recorder.getBuffer(sketch.decodeBuffer);
      }
    }
  };

  sketch.setSample = function(s) {
    sample = sketch.loadSound(s);
    // sample.rate(.5);
    sketch.text(sample.url, sketch.width/2, sketch.height/2);
    amp.setInput(sample);
    amp.toggleNormalize();
  };

  sketch.decodeBuffer = function(buf) {
    // create an AudioBuffer of the appropriate size and # of channels,
    // and copy the data from one Float32 buffer to another
    console.log(buf);
    var audioContext = getAudioContext();
    var newAudioBuff = audioContext.createBuffer(2, buf[0].length, audioContext.sampleRate);
      // for (var channelNum = 0; channelNum < audioBuffer.numberOfChannels; channelNum++){
      //   var channel = audioBuffer.getChannelData(channelNum);
      //   channel.set(audioBuffer[channelNum]);
      // }
      console.log(newAudioBuff);
    var channel = newAudioBuff.getChannelData(0);
    channel.set(buf[0]);
    console.log(channel);
    // channel.set(AudioBuffer);
    // channel.set(AudioBuffer[1]);
//      return audioBuffer;
    sample.buffer = newAudioBuff;
  };
  //   sample.p5s.audiocontext.decodeAudioData(wav, function(buff) {
  //     sample.buffer = wav;
  //     console.log(wav);
  //     console.log(buff);
  //     recorder.clear();
  //   });
  // };

};

window.onload = function() {
    var containerNode = document.getElementById( 'pad1' );
    var pad1 = new p5(drumpad, containerNode);
    var containerNode2 = document.getElementById( 'pad2' );
    var pad2 = new p5(drumpad, containerNode2);
    pad1.setSample('audio/drum2.wav');
    pad2.setSample('audio/drum6.wav');
};

function setup(){
  createGUI();
  mic = new AudioIn();
}

function draw(){
  modeButton.html('CURRENT MODE: ' + mode);
}

var createGUI = function() {
  modeButton = createButton('CURRENT MODE: ' + mode);
  modeButton.mousePressed(toggleMode);
}

var toggleMode = function(){
  if (mode === 'play') {
    mode = 'rec';
    mic.on();
  }
  else {
    mode = 'play';
  }
  console.log(mode);
}