var mode = 'play';
var settings = false;
var modeButton, setButton;
var modeButtonLabel = 'Switch to record mode'; 
var colorPalette;
var mic;
var recorder;
var fft;
var pad1, pad2, pad3, pad4;

var drumpad = function( sketch ) {
  var sample;
  var cnv;
  var bgColor = [ random(0,255), random(0,255), random(0,255) ];
  var recording = false;
  var recTime = 0;
  var amp = new Amplitude();

  // settings for this pad
  var newRate;
  var rateSlider = createSlider(0,100,29);
  var revButton = createButton('Reverse');
  var settingsText;

  sketch.setup = function() {
    cnv = sketch.createCanvas(400, 400);
    cnv.mousePressed(sketch.pressed);
    revButton.mousePressed(sketch.revBuffer);
    sketch.background(sketch.random(0,255));
  };

  sketch.draw = function() {
    if (mode === 'play'){

      // reset the mic amplitude's volMax
      mic.amplitude.volMax = .1;

      sketch.hideSettings();
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
          console.log('bang!');
        }

      }
    } else if (mode === 'rec') {
      if (recording) {

        // if waiting for attack...
        if (recording === 'preAttack') {
          sketch.text('Make Some Noiz!' + recTime, sketch.width/2, sketch.height/2);
          if (mic.getLevel() > .5) {
            recorder.record();
            recording = true;
          }
        }

        //
        else if (recording === true ) {
          sketch.text('Recording!' + recTime, sketch.width/2, sketch.height/2);
          // draw waveform if recording
          var waveform = fft.waveform();
          sketch.beginShape();
          sketch.background(255,0,0,200);
          for (var i = 0; i< waveform.length; i++){
            var x = map(i, 0, waveform.length, 0, sketch.width);
            var y = map(waveform[i], 0, 255, sketch.height, 0);
            sketch.vertex(x,y);
          }
          sketch.endShape();

          // if volume is below a certain threshold, we are done recording
          if (mic.getLevel() < .0125) {
            recording = false;
            recorder.stop();
            recorder.getBuffer(sketch.decodeBuffer);
            // back to play mode!
            toggleMode();
          }
        } else {
        sketch.background(bgColor);
        }
      }
    } else if (mode === 'settings') {
      sketch.showSettings();
      newRate = map( rateSlider.value() , 0, 100, .1831, 3);
      sample.rate( newRate );
      settingsText;
      // if (amp.getLevel() > .00) {
        var alpha = floor(map(amp.getLevel(), 0, .2, 10, 255));
        alpha = constrain(alpha, 0,255);
        sketch.background(255,255,0, alpha);
        var alpha = floor(map(amp.getLevel(), 0, .2, 10, 50));
        alpha = constrain(alpha, 0,10);
        sketch.background(0,0,0, alpha);
      // }
    }
  };

  sketch.pressed = function() {
    if (mode === 'play' || mode === 'settings') {
      sample.play();
    } else if (mode === 'rec') {
      if (recording === false) {
        sample.stopAll();
        sketch.background(255,0,0,200);
        if (mic.getLevel() > .01) {
          // record on attack
          recording = 'preAttack';
          // recording = true;
          // recorder.record();
          // console.log('recording!');
        }
      } else {
        recording = false;
        recorder.stop();
        recorder.getBuffer(sketch.decodeBuffer);
        // back to play mode!
        toggleMode();
      }
    }
  };

  sketch.setSample = function(s) {
    sample = sketch.loadSound(s);
    sample.volume = .5;
    sample.setLoop(true);
    sample.playMode('mono');
    // sample.rate(.5);
    sketch.text(sample.url, sketch.width/2, sketch.height/2);
    amp.setInput(sample.output);
    amp.toggleNormalize();
  };


  sketch.setBuffer = function(buf){
    sample.buffer = buf;
    recorder.clear();
  };
  // reset the buffer for this sketch's sample using data from the recorder
  sketch.decodeBuffer = function(buf) {
    // create an AudioBuffer of the appropriate size and # of channels,
    // and copy the data from one Float32 buffer to another
    console.log(buf);
    var audioContext = sketch.getAudioContext();
    var newBuffer = audioContext.createBuffer(2, buf[0].length, audioContext.sampleRate);
    for (var channelNum = 0; channelNum < newBuffer.numberOfChannels; channelNum++){
      var channel = newBuffer.getChannelData(channelNum);
      channel.set(buf[channelNum]);
      console.log(channel);
    }
    sample.buffer = newBuffer;
    recorder.clear();
  };

  sketch.revBuffer = function() {
    console.log('reversed!');
    sample.reverseBuffer();
  };


  sketch.settingsPosition = function(w, h){
    sketch.stroke(255);
    settingsText = text('Playback Rate: ' + newRate, w/2, h/2-100);
    rateSlider.position(w/2, h/2);
    revButton.position(w/2, h/2+100)
    cnv.position(w-400,h-400);
    console.log(rateSlider);
  };

  sketch.showSettings = function() {
    // sketch.background(25);
    rateSlider.show();
    revButton.show();
  };

  sketch.hideSettings = function() {
    rateSlider.hide();
    revButton.hide();
  };

}; // end drumpad



function setup(){
  createGUI();
  mic = new AudioIn();
  mic.on();
  mic.amplitude.toggleNormalize();
  fft = new FFT(.1, 128);
  fft.setInput(mic);
  recorder = new Recorder(mic);
}

function draw(){
  modeButton.html(modeButtonLabel);
}

function keyPressed(e){
  console.log(e.keyCode);
  if (e.keyCode == '37') {
    pad2.pressed();
  };
  if (e.keyCode == '39') {
    pad4.pressed();
  };
  if (e.keyCode == '65') {
    pad1.pressed();
  };
  if (e.keyCode == '68') {
    pad3.pressed();
  };
};

var createGUI = function() {
  modeButton = createButton(modeButtonLabel);
  modeButton.position(800,20);
  modeButton.mousePressed(toggleMode);

  setButton = createButton('Settings');
  setButton.position(800,40);
  setButton.mousePressed(toggleSettings);

};

var toggleMode = function(){
  if (mode !== 'rec') {
    mode = 'rec';
    modeButtonLabel = 'Click a pad to record!'
  }
  else {
    mode = 'play';
    modeButtonLabel = 'Switch to record mode';
  }
};

var toggleSettings = function(){
  if (mode !== 'settings') {
    mode = 'settings';
    setButton.html('Back to Play Mode');
  }
  else {
    mode = 'play';
    setButton.html('Settings');
  }
};



// Set up the pads!
window.onload = function() {
    var containerNode = document.getElementById( 'pad1' );
    pad1 = new p5(drumpad, containerNode);
    pad1.setSample('audio/drum2.mp3');
    pad1.settingsPosition(400, 400);
    containerNode.pCtx = pad1;
    containerNode.addEventListener('dragover', handleDragOver, false);
    containerNode.addEventListener('drop', handleFileSelect, false);

    var containerNode2 = document.getElementById( 'pad2' );
    pad2 = new p5(drumpad, containerNode2);
    pad2.setSample('audio/drum6.mp3');
    pad2.settingsPosition(400, 800);
    containerNode2.pCtx = pad2;
    containerNode2.addEventListener('dragover', handleDragOver, false);
    containerNode2.addEventListener('drop', handleFileSelect, false);


    var containerNode3 = document.getElementById( 'pad3' );
    pad3 = new p5(drumpad, containerNode3);
    pad3.setSample('audio/drum5.mp3');
    pad3.settingsPosition(800, 400);
    containerNode3.pCtx = pad3;
    containerNode3.addEventListener('dragover', handleDragOver, false);
    containerNode3.addEventListener('drop', handleFileSelect, false);


    var containerNode4 = document.getElementById( 'pad4' );
    pad4 = new p5(drumpad, containerNode4);
    pad4.setSample('audio/drum4.mp3');
    pad4.settingsPosition(800, 800);
    containerNode4.pCtx = pad4;
    containerNode4.addEventListener('dragover', handleDragOver, false);
    containerNode4.addEventListener('drop', handleFileSelect, false);
};
