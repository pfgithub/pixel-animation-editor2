function fixArrLen<T>(arr: T[], len: number, fill: T) {
  while (arr.length < len) {
    arr.push(fill);
  }
  return arr;
}

function v5Export(data: boolean[][][], width: number, height: number) {
  data = JSON.parse(JSON.stringify(data));
  const frames: boolean[][][] = data.map(frame => {
    frame = fixArrLen(frame || [], height, []);
    frame = frame.map(row => {
      return fixArrLen(row || [], width, false).map(i => !!i);
    });
    console.log("WORKING ON FRAME", frame);
    const invertedData: boolean[][] = [];
    // invertedData[x][y] = frame[y][x]
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        if (!invertedData[x]) {
          invertedData[x] = [];
        }
        invertedData[x][y] = frame[y][x];
      }
    }
    return invertedData;
  });
  const fulldata = frames.map(frame => {
    const rowdata = frame.map(row => {
      return `{ ${row.map(i => (i ? "true" : "false")).join(`, `)} }`;
    });
    return `
  states = new boolean[][]{
    ${rowdata.join(`,\n    `)}
  };
  pushStates();
  delay(patternPlaybackSpeed);
    `;
  });
  return fulldata
    .join(`\n`)
    .split(`\n`)
    .join(``)
    .split(` `)
    .join(``)
    .split(`newboolean`)
    .join(`new boolean`);
}
