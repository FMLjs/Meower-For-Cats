// Purple Rain
// (138, 43, 226)
// (230, 230, 250) // background

var drops = [];

let canvas;

function setup() {
  canvas = createCanvas(document.body.clientWidth, document.documentElement.scrollHeight);
  canvas.position(0, 0);
  canvas.style('z-index', '-1');
  for (var i = 0; i < 500; i++) {
    drops[i] = new Drop();
  }
};


function windowResized() {
  resizeCanvas(document.body.clientWidth, document.documentElement.scrollHeight);
};

function draw() {
  background(230, 230, 250);
  for (var i = 0; i < drops.length; i++) {
    drops[i].fall();
    drops[i].show();
  }
};

// function windowResized() {
//   const css = getComputedStyle(canvas.parentElement),
//     mw = float(css.marginLeft) + float(css.marginRight),
//     mh = float(css.marginTop) + float(css.marginBottom),
//     ww = float(css.width) || windowWidth,
//     wh = float(css.height) || windowHeight,
//     w = round(ww - mw), h = round(wh - mh);

//   resizeCanvas(w, h, true);
// };
