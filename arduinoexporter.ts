//const input = require("./dnl.pattern.json");

const arduinoExporter = (input: boolean[][][]) => {
  const allPixels: any = [];
  const frames: any = [];

  function posconverter(x: any, y: any) {
    //0                   5
    // 10[g r b] 11[g r b]
    //  8[g r b] 9[g r b]
    //  6[g r b] 7[g r b]
    //  4[g r b] 5[g r b]
    //  2[g r b] 3[g r b]
    //  0[g r b] 1[g r b]
    //5
    const side = Math.floor(x / 3);
    const colorStart = x % 3; // 0=g 1=r 2=b
    const posStart = (5 - y) * 2;
    return [
      posStart + side,
      [
        colorStart === 1 ? "255" : 0,
        colorStart === 0 ? "255" : 0,
        colorStart === 2 ? "255" : 0
      ]
    ];
  }

  function mergePosArrays(pos1: any, pos2: any) {
    if (!pos1 || !pos2) {
      return pos1 || pos2;
    }
    return [pos1[0] || pos2[0], pos1[1] || pos2[1], pos1[2] || pos2[2]];
  }

  /*for(let x = 0; x < 6; x++){
    for(let y = 0; y < 6; y++){
      console.log(x, y, posconverter(x, y));
    }
  }*/

  input.forEach((arr, frame) => {
    // arr is 2d array containing pixels
    if (!frames[frame]) {
      frames[frame] = {};
    }
    if (arr) {
      arr.forEach((line, y) => {
        if (line) {
          line.forEach((val, x) => {
            val = !!val;
            if (!val) {
              return;
            }
            const rgbpos = posconverter(x, y);
            frames[frame][+rgbpos[0]] = mergePosArrays(
              frames[frame][+rgbpos[0]],
              rgbpos[1]
            );
            allPixels[+rgbpos[0]] = true;
          });
        }
      });
    }
  });

  function genSets() {
    let res = "";
    frames.forEach((frame: any, i: number) => {
      res += `  case ${i}:\n`;
      Object.keys(frame).forEach(key => {
        const val = frame[key];
        res += `    strip.setPixelColor(${key}, ${val.join(", ")});\n`;
      });
      res += `    strip.show();\n      break;\n`;
    });
    return `  switch (t) {
  ${res}  }\n`;
  }

  function genResets() {
    let res = "";
    allPixels.forEach((_pixel: any, i: number) => {
      res += `    strip.setPixelColor(${i}, Black);\n`;
    });
    res += "    strip.show();\n";
    return res;
  }

  function genFn() {
    return `
uint8_t t = 0;
void testPatternSquare() {
  if(t >= ${frames.length}) t = 0;
  for(int i = 0; i < pushDistance/10; i++){
    uint8_t d = 255;
${genSets()}
    delay(pushTime);
${genResets()}
    delay(pushTimeUp);
  }
  t++;
}
  `;
  }

  return `${arduinoProgramFileAdditionToTop}\n${genFn()}`;
};

/*

uint8_t t = 0;
void testPatternSquare() { // g r b
  if(t >= 3) t = 0;
  // put correct piece down
  uint8_t d = pushDistance;
  switch (t) {
    case 0:
      strip.setPixelColor(2, d, 0, 0);
      strip.setPixelColor(3, d, 0, 0);
      strip.setPixelColor(8, d, 0, 0);
      strip.setPixelColor(9, d, 0, 0);  strip.show();
      break;
    case 1: 
      strip.setPixelColor(2, 0, 0, d);
      strip.setPixelColor(5, d, 0, 0);
      strip.setPixelColor(6, d, 0, 0);
      strip.setPixelColor(9, 0, d, 0);  strip.show();
      break;
    case 2: 
      strip.setPixelColor(3, 0, d, 0);  strip.show();
      strip.setPixelColor(7, d, 0, 0);  strip.show();
      strip.setPixelColor(4, d, 0, 0);  strip.show();
      strip.setPixelColor(8, 0, 0, d);  strip.show();
      break;
  }
  delay(pushTime);
  // unput correct piece down
  strip.setPixelColor(2, Black);
  strip.setPixelColor(3, Black);
  strip.setPixelColor(4, Black);
  strip.setPixelColor(5, Black);
  strip.setPixelColor(6, Black);
  strip.setPixelColor(7, Black);
  strip.setPixelColor(8, Black);
  strip.setPixelColor(9, Black);
  delay(pushTimeUp);
  t++;
}

*/
