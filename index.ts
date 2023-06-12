/* global document, window, arduinoExporter, v5Export */
// canvas

export {};

type Frame = { ctx: CanvasRenderingContext2D; data: boolean[][] };
const frames: Frame[] = [];
let currentFrame = -1;

const mainContextDom = <HTMLCanvasElement>document.getElementById("main");
const mainCtx = <CanvasRenderingContext2D>mainContextDom.getContext("2d");

const miniContextDom = <HTMLCanvasElement>document.getElementById("mini");
const miniCtx = <CanvasRenderingContext2D>miniContextDom.getContext("2d");

const urlParams = new URLSearchParams(window.location.search);

const WIDTH = +(urlParams.get("width") || 6);
const HEIGHT = +(urlParams.get("height") || 6);

let newFrameOnDrag: boolean = true;

mainContextDom.width = WIDTH;
mainContextDom.height = HEIGHT;

const id = mainCtx.createImageData(1, 1); // only do this once per page
const d = id.data; // only do this once per page

mainCtx.imageSmoothingEnabled = false;

function updateMiniContextSize() {
  miniContextDom.height = HEIGHT;
  miniContextDom.width = WIDTH * frames.length;

  miniContextDom.style.width = `${WIDTH * frames.length}px`;
  miniContextDom.style.height = `${HEIGHT}px`;
  renderFrame();
}

function createContext() {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  return <CanvasRenderingContext2D>canvas.getContext("2d");
  //return mainCtx;
}

function fillPixel(a: boolean, x: number, y: number) {
  d[0] = 255 * +!a;
  d[1] = 255 * +!a;
  d[2] = 255 * +!a;
  d[3] = 255 * +a; // a = true; 255 =
  frames[currentFrame].ctx.putImageData(id, x, y);
  if (!frames[currentFrame].data[y]) {
    frames[currentFrame].data[y] = [];
  }
  frames[currentFrame].data[y][x] = !!a;
  renderFrame();
}

function insertFrame() {
  currentFrame += 1;
  frames.splice(currentFrame, 0, { ctx: createContext(), data: [] });
  updateMiniContextSize();
  renderFrame();
}

function copyFrame() {
  insertFrame();
  const copiedFrame = currentFrame - 1;
  frames[currentFrame].ctx.drawImage(frames[copiedFrame].ctx.canvas, 0, 0);
  frames[currentFrame].data = frames[copiedFrame].data.slice();
  renderFrame();
}

insertFrame();

function clickHandle(elid: string, handler: (e: HTMLButtonElement) => void) {
  const el = getElement(elid, HTMLButtonElement);
  el.addEventListener("click", () => handler(el));
}

function getElement<T extends HTMLElement>(elid: string, type: { new (): T }) {
  const el = document.getElementById(elid);
  if (!el) {
    alert(`The element ${el} does not exist`);
    throw new Error("!el");
  }
  if (!(el instanceof type)) {
    alert(`The element ${el} #${elid} was not of the expected type ${type}`);
    throw new Error("!el instanceof type");
  }
  return el;
}

clickHandle("insert", () => {
  insertFrame();
});
clickHandle("copy", () => {
  copyFrame();
});
clickHandle("deletf", () => {
  frames.splice(currentFrame, 1);
  currentFrame--;
  updateMiniContextSize();
  renderFrame();
});
clickHandle("left", () => {
  currentFrame--;
  currentFrame = Math.max(currentFrame, 0); //
  updateMiniContextSize();
  renderFrame();
});
clickHandle("right", () => {
  currentFrame++;
  currentFrame = Math.min(currentFrame, frames.length - 1);
  updateMiniContextSize();
  renderFrame();
});

clickHandle("export", () => done());

let prevPixelPosX: number | undefined;
let prevPixelPosY: number | undefined;

let pixelTrail: { x: number; y: number }[] = [];
const pixelTrailLength = () =>
  getElement("nfodtail", HTMLInputElement).valueAsNumber;
const sizeLength = () => getElement("penwidth", HTMLInputElement).valueAsNumber;

function sizefill(erasemode: boolean, x: number, y: number) {
  const size = sizeLength();
  for (
    let n = Math.floor(x - (size - 1) / 2);
    n <= Math.floor(x + (size - 1) / 2);
    n++
  ) {
    for (
      let n2 = Math.floor(y - (size - 1) / 2);
      n2 <= Math.floor(y + (size - 1) / 2);
      n2++
    ) {
      fillPixel(erasemode, n, n2);
    }
  }
}

function doClicked(e: MouseEvent | Touch) {
  if (e instanceof MouseEvent) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    if (e.stopImmediatePropagation) {
      e.stopImmediatePropagation();
    }
    if (e.stopPropagation) {
      e.stopPropagation();
    }
  }
  const pixelPosX = Math.floor(
    e.clientX / (mainContextDom.clientWidth / WIDTH)
  );
  const pixelPosY = Math.floor(
    e.clientY / (mainContextDom.clientHeight / HEIGHT)
  );

  console.log(e);

  const erasemode =
    (e instanceof MouseEvent ? e.buttons || -1 : -1) > 1 ? false : drawerase;

  if (newFrameOnDrag) {
    if (prevPixelPosX !== undefined && prevPixelPosY !== undefined) {
      if (pixelPosX !== prevPixelPosX || pixelPosY !== prevPixelPosY) {
        insertFrame();
        pixelTrail.forEach(({ x, y }) => {
          sizefill(erasemode, x, y);
        });
        pixelTrail.push({ x: pixelPosX, y: pixelPosY });
        while (pixelTrail.length >= pixelTrailLength()) {
          pixelTrail.shift();
        }
      } else {
        return;
      }
    }
  }

  sizefill(erasemode, pixelPosX, pixelPosY);
  prevPixelPosX = pixelPosX;
  prevPixelPosY = pixelPosY;
  return false;
}

let mouseButtonPressed = -1;

mainContextDom.addEventListener("click", doClicked);
document.body.addEventListener("contextmenu", doClicked);
mainContextDom.addEventListener("touchstart", t => {
  Array.from(t.changedTouches).forEach(e => doClicked(e));
});
mainContextDom.addEventListener("touchmove", t => {
  Array.from(t.changedTouches).forEach(e => doClicked(e));
});
mainContextDom.addEventListener("mousedown", e => {
  doClicked(e);
  mouseButtonPressed = e.button;
});

mainContextDom.addEventListener("mousemove", e => {
  if (mouseButtonPressed > -1) {
    doClicked(e);
  }
});
mainContextDom.addEventListener("mouseup", () => {
  mouseButtonPressed = -1;
});
mainContextDom.addEventListener("mouseout", () => {
  mouseButtonPressed = -1;
});
document.addEventListener("blur", () => {
  mouseButtonPressed = -1;
});
document.addEventListener("focus", () => {
  mouseButtonPressed = -1;
});

let drawerase = true;
clickHandle("drawerase", () => {
  drawerase = !drawerase;
  getElement("drawerase", HTMLButtonElement).innerText = drawerase
    ? "Draw"
    : "Erase";
});

const hotkeys: { [key: string]: HTMLButtonElement } = {};
Array.from(document.getElementsByTagName("button")).forEach(button => {
  const hotkey = button.getAttribute("hotkey");
  hotkeys[hotkey || "NoHotkey"] = button;
  button.setAttribute(
    "title",
    hotkey ? `Press ${hotkey} to click` : `No hotkey set for this button.`
  );
  button.addEventListener("click", () => button.blur());
});

document.addEventListener("keydown", e => {
  if (hotkeys[e.code]) {
    hotkeys[e.code].click();
  }
});

function renderFrameOpacity(distance: number, alpha: number, ant?: boolean) {
  if (frames[currentFrame + distance]) {
    mainCtx.globalAlpha = alpha;
    mainCtx.drawImage(
      frames[(!ant ? currentFrame : 0) + distance].ctx.canvas,
      0,
      0
    );
  }
}

function renderFrameMini(frame: number, alpha: number) {
  if (frames[frame]) {
    miniCtx.globalAlpha = 0.25;
    let color = Math.floor(frame / 2) === frame / 2 ? 255 : 155;
    if (alpha > 0.9) {
      color = 0;
    }
    miniCtx.fillStyle = `rgba(${color}, ${color}, ${color}, 1.0)`;
    miniCtx.fillRect(WIDTH * frame, 0, WIDTH, HEIGHT);

    miniCtx.globalAlpha = alpha;
    miniCtx.drawImage(frames[frame].ctx.canvas, WIDTH * frame, 0);
    //console.log(frame, alpha, WIDTH*frame);
  }
}

function renderFrame(doNtShowOpacities?: boolean) {
  mainCtx.globalAlpha = 1.0;
  mainCtx.clearRect(0, 0, mainContextDom.width, mainContextDom.height);

  renderFrameOpacity(0, 1.0); // current
  if (!doNtShowOpacities) {
    renderFrameOpacity(0, 1 / 16, true); // always show first frame

    renderFrameOpacity(1, 1 / 4); // one ahead

    renderFrameOpacity(-1, 1 / 2); // behind
    renderFrameOpacity(-2, 1 / 4);
    renderFrameOpacity(-3, 1 / 8);
  }

  (<HTMLSpanElement>(
    document.getElementById("current")
  )).innerText = `${currentFrame}`;

  miniCtx.globalAlpha = 1.0;
  miniCtx.clearRect(0, 0, miniContextDom.width, miniContextDom.height);
  frames.forEach((_frame, i) => {
    renderFrameMini(i, i === currentFrame ? 1.0 : 0.5);
  });
}

function download(filename: string, text: string, dnlshow?: boolean) {
  if (dnlshow) {
    const myWindow = window.open("");
    if (!myWindow) {
      alert("Failed to open window. Check your popup blocker.");
      throw new Error("!myWindow");
    }
    const codeTag = myWindow.document.createElement("textarea");
    codeTag.setAttribute("id", "hello");
    codeTag.setAttribute(
      "style",
      "position:fixed;top:0;left:0;width:100%;height:100%;"
    );
    codeTag.value = text;
    myWindow.document.body.appendChild(codeTag);
    const textarea = <HTMLTextAreaElement>(
      myWindow.document.getElementById("hello")
    );
    const range = myWindow.document.createRange();
    range.selectNode(textarea);
    const selection = myWindow.getSelection();
    selection && selection.addRange(range);
    textarea.select();
    //window.open(`data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
    return;
  }

  const element = document.createElement("a");
  element.setAttribute(
    "href",
    `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function done() {
  const resarr: boolean[][][] = [];
  frames.forEach(frame => {
    resarr.push(frame ? frame.data : []);
  });
  //window.prompt("ctrl+c", JSON.stringify(resarr));
  console.log(JSON.stringify(resarr));
  const filename = prompt("Filename?");
  if (!filename) {
    return;
  }
  download(`${filename}.pattern.json`, JSON.stringify(resarr));
  download("", JSON.stringify(resarr), true);
}
clickHandle("exportText", () => doneText());
clickHandle("exportTextDnl", () => doneTextDnl());
clickHandle("exportv5", () => doneTextv5());
function doneText() {
  const resarr: boolean[][][] = [];
  frames.forEach(frame => {
    resarr.push(frame ? frame.data : []);
  });
  //window.prompt("ctrl+c", JSON.stringify(resarr));
  download("", arduinoExporter(resarr), true);
}
function doneTextv5() {
  const resarr: boolean[][][] = [];
  frames.forEach(frame => {
    resarr.push(frame ? frame.data : []);
  });
  //window.prompt("ctrl+c", JSON.stringify(resarr));
  download("", v5Export(resarr, WIDTH, HEIGHT), true);
}
function doneTextDnl() {
  const resarr: boolean[][][] = [];
  frames.forEach(frame => {
    resarr.push(frame ? frame.data : []);
  });
  //window.prompt("ctrl+c", JSON.stringify(resarr));
  download(`${window.prompt("Filename?")}.txt.cpp`, arduinoExporter(resarr));
  download("", arduinoExporter(resarr), true);
}

clickHandle("dragmode", button => {
  newFrameOnDrag = !newFrameOnDrag;
  if (newFrameOnDrag) {
    pixelTrail = [];
    button.innerText = "[X] New Frame on Drag";
  } else {
    button.innerText = "[ ] New Frame on Drag";
  }
});

let pause = false;
let playing = false;
clickHandle("play", () => playS());
function playS() {
  if (!playing) {
    play(currentFrame);
    getElement("play", HTMLElement).innerText = "Pause";
  } else {
    pause = true;
    playing = false;
    getElement("play", HTMLElement).innerText = "Play";
  }
}
clickHandle("aspect", () => {
  mainContextDom.classList.toggle("fullwidth");

  getElement(
    "aspect",
    HTMLButtonElement
  ).innerText = mainContextDom.classList.contains("fullwidth")
    ? "1:1 Mode"
    : "Stretched Mode";
});
clickHandle("resize", () => {
  const sure = window.confirm(
    "Resize will delete your animation. OK = Delete animation and resize, Cancel = Continue working"
  );
  if (!sure) {
    return;
  }
  const wh = window.prompt("width x height");
  if (!wh) {
    return;
  }
  let w = 6;
  let h = 6;
  if (wh.indexOf(",") > -1) {
    w = +wh.split(",")[0].trim();
    h = +wh.split(",")[1].trim();
  } else if (wh.indexOf("x") > -1) {
    w = +wh.split("x")[0].trim();
    h = +wh.split("x")[1].trim();
  } else {
    w = +wh;
    const nvh = window.prompt("height");
    if (!nvh) {
      return;
    }
    h = +nvh;
  }
  urlParams.set("width", `${w}`);
  urlParams.set("height", `${h}`);
  window.location.href = `${window.location.pathname}?${urlParams.toString()}`;
});
function play(frame: number) {
  playing = true;
  if (pause) {
    pause = false;
    playing = false;
    return;
  }
  currentFrame = frame;
  renderFrame(true);
  if (frames[frame + 1]) {
    setTimeout(
      () => play(frame + 1),
      +getElement("playSpeed", HTMLInputElement).value
    );
  } else {
    setTimeout(() => play(0), +getElement("playSpeed", HTMLInputElement).value);
  }
}

setInterval(() => {
  if (!playing) {
    renderFrame();
  }
}, 1000);
setInterval(() => {
  const prevFrame = currentFrame;
  currentFrame = Math.max(Math.min(currentFrame, frames.length - 1), 0);
  if (currentFrame !== prevFrame) {
    renderFrame();
  }
  if (frames.length < 1) {
    insertFrame();
  }
}, 10);
