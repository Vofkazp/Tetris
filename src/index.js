import './index.scss';
import Tetris from "./modules/tetris";
import {convertPositionToIndex, PLAY_FIELD_COLUMNS, PLAY_FIELD_ROWS, SAD} from "./modules/utilites";
import 'hammerjs';

let requestId;
let timeoutId;
let hammer;
let isPaused = false;
const tetris = new Tetris();
const cells = document.querySelectorAll('.grid>div');

startGame();

function startGame() {
  initKeyDown();
  initPaused();
  initTouch();
  initTouchPaused();
  moveDown();
}

function initKeyDown() {
  document.addEventListener('keydown', onKeyDown);
}

function initPaused() {
  document.addEventListener('keydown', onPaused);
}

function initTouchPaused() {
  document.addEventListener('dblclick', e => e.preventDefault());
  hammer = new Hammer(document.body);
  hammer.on('press', () => {
    isPaused ? endPause() : startPause();
  })
}

function initTouch() {
  document.addEventListener('dblclick', e => e.preventDefault());
  hammer = new Hammer(document.body);
  hammer.get('pan').set({direction: Hammer.DIRECTION_ALL});
  hammer.get('swipe').set({direction: Hammer.DIRECTION_ALL});
  const treshold = 30;
  let deltaX = 0;
  let deltaY = 0;

  hammer.on('panstart', () => {
    deltaX = 0;
    deltaY = 0;
  })

  hammer.on('panleft', (event) => {
    if(Math.abs(event.deltaX - deltaX ) > treshold) {
      moveLeft();
      deltaX = event.deltaX;
      deltaY = event.deltaY;
    }
  })

  hammer.on('panright', (event) => {
    if(Math.abs(event.deltaX - deltaX ) > treshold) {
      moveRight();
      deltaX = event.deltaX;
      deltaY = event.deltaY;
    }
  })

  hammer.on('pandown', (event) => {
    if(Math.abs(event.deltaY - deltaY ) > treshold) {
      moveDown();
      deltaX = event.deltaX;
      deltaY = event.deltaY;
    }
  })

  hammer.on('swipedown', () => {
    dropDown();
  })

  hammer.on('tap', () => {
    rotate();
  })
}

function onKeyDown(event) {
  switch (event.key) {
    case 'ArrowUp':
      rotate();
      break;
    case 'ArrowDown':
      moveDown();
      break;
    case 'ArrowLeft':
      moveLeft();
      break;
    case 'ArrowRight':
      moveRight();
      break;
    case ' ':
      dropDown();
      break;
    default:
      break;
  }
}

function onPaused(event) {
  switch (event.key) {
    case 'p':
      isPaused ? endPause() : startPause();
      break;
    default:
      break;
  }
}

function startPause() {
  isPaused = true;
  stopLoop();
  document.removeEventListener('keydown', onKeyDown);
  hammer.off('panstart panleft panright pandown swipedown tap');
  const div = document.createElement('div');
  div.classList.add('paused');
  div.innerHTML = '<p>PAUSE</p>';
  document.querySelector('.grid').appendChild(div);
}

function endPause() {
  isPaused = false;
  initKeyDown();
  initTouch();
  moveDown();
  document.querySelector('.paused').remove();
}

function rotate() {
  tetris.rotateTetromino();
  draw();
}

function moveDown() {
  tetris.moveTetrominoDown();
  draw();
  stopLoop();
  startLoop();
  if(tetris.isGameover) gameOver();
}

function startLoop() {
  timeoutId = setTimeout(() => requestId = requestAnimationFrame(moveDown), 700);
}

function stopLoop() {
  cancelAnimationFrame(requestId);
  clearTimeout(timeoutId);
}

function moveLeft() {
  tetris.moveTetrominoLeft();
  draw();
}

function moveRight() {
  tetris.moveTetrominoRight();
  draw();
}

function dropDown() {
  tetris.dropTetrominoDown();
  draw();
  stopLoop();
  startLoop();
  if(tetris.isGameover) gameOver();
}

function draw() {
  cells.forEach(cell => cell.removeAttribute('class'));
  drawPlayfield();
  drawTetromino();
  drawGhostTetromino();
  console.log(tetris.score);
}

function drawTetromino() {
  const name = tetris.tetromino.name;
  const tetrominoMatrixSize = tetris.tetromino.matrix.length;
  for (let row = 0; row < tetrominoMatrixSize; row++) {
    for (let column = 0; column < tetrominoMatrixSize; column++) {
      if(!tetris.tetromino.matrix[row][column]) continue;
      if(tetris.tetromino.row + row < 0) continue;
      const cellIndex = convertPositionToIndex(tetris.tetromino.row + row, tetris.tetromino.column + column);
      cells[cellIndex].classList.add(name);
    }
  }
}

function drawPlayfield() {
  for (let row = 0; row < PLAY_FIELD_ROWS; row++) {
    for (let column = 0; column < PLAY_FIELD_COLUMNS; column++) {
      if (!tetris.playField[row][column]) continue;
      const name = tetris.playField[row][column];
      const cellIndex = convertPositionToIndex(row, column);
      cells[cellIndex].classList.add(name);
    }
  }
}

function gameOver() {
  stopLoop();
  document.removeEventListener('keydown', onKeyDown);
  hammer.off('panstart panleft panright pandown swipedown tap');
  gameOverAnimations();
}

function drawGhostTetromino() {
  const tetrominoMatrixSize = tetris.tetromino.matrix.length;
  for (let row = 0; row < tetrominoMatrixSize; row++) {
    for (let column = 0; column < tetrominoMatrixSize; column++) {
      if(!tetris.tetromino.matrix[row][column]) continue;
      if(tetris.tetromino.row + row < 0) continue;
      const cellIndex = convertPositionToIndex(tetris.tetromino.ghostRow + row, tetris.tetromino.ghostColumn + column);
      cells[cellIndex].classList.add('ghost');
    }
  }
}

function gameOverAnimations() {
  const fieldCells = [...cells].filter(cell => cell.classList.length > 0);
  fieldCells.forEach((cell, i) => {
    setTimeout(() => cell.classList.add('hide'), i * 10);
    setTimeout(() => cell.removeAttribute('class'), i * 10 + 500);
  });

  setTimeout(drawSad, fieldCells.length * 10 + 1000);

}

function drawSad() {
  const TOP_OFFSET = 5;
  for (let row = 0; row < SAD.length; row++) {
    for (let column = 0; column < SAD[0].length; column++) {
      if(!SAD[row][column]) continue;
      const cellIndex = convertPositionToIndex(TOP_OFFSET + row, column);
      cells[cellIndex].classList.add('sad');
    }
  }
}