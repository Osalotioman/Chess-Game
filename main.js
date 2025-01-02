const board = document.getElementById("board");
const turnDisplay = document.getElementById("turn");
const promotionPrompt = document.querySelector(".promotion-options-container");
var defaultPositions = [
    { row: 0, col: 0, src: 'black-rook', turn:0 }, { row: 0, col: 1, src: 'black-knight' }, { row: 0, col: 2, src: 'black-bishop' }, { row: 0, col: 3, src: 'black-queen' }, { row: 0, col: 4, src: 'black-king' }, { row: 0, col: 5, src: 'black-bishop' }, { row: 0, col: 6, src: 'black-knight' }, { row: 0, col: 7, src: 'black-rook' },
    { row: 1, col: 0, src: 'black-pawn' }, { row: 1, col: 1, src: 'black-pawn' }, { row: 1, col: 2, src: 'black-pawn' }, { row: 1, col: 3, src: 'black-pawn' }, { row: 1, col: 4, src: 'black-pawn' }, { row: 1, col: 5, src: 'black-pawn' }, { row: 1, col: 6, src: 'black-pawn' }, { row: 1, col: 7, src: 'black-pawn' },
    { row: 6, col: 0, src: 'white-pawn' }, { row: 6, col: 1, src: 'white-pawn' }, { row: 6, col: 2, src: 'white-pawn' }, { row: 6, col: 3, src: 'white-pawn' }, { row: 6, col: 4, src: 'white-pawn' }, { row: 6, col: 5, src: 'white-pawn' }, { row: 6, col: 6, src: 'white-pawn' }, { row: 6, col: 7, src: 'white-pawn' },
    { row: 7, col: 0, src: 'white-rook' }, { row: 7, col: 1, src: 'white-knight' }, { row: 7, col: 2, src: 'white-bishop' }, { row: 7, col: 3, src: 'white-queen' }, { row: 7, col: 4, src: 'white-king' }, { row: 7, col: 5, src: 'white-bishop' }, { row: 7, col: 6, src: 'white-knight' }, { row: 7, col: 7, src: 'white-rook' },
];
const CONSTS = {
    SQUARE_SIZE: 40,
    CAPTURE_DELAY: 250,
    MOVE_DELAY: 500,
    MIN_INDEX: 0,
    MAX_INDEX: 7,
    DIR_TOP_ROOK: [0, -1, +1, 0],
    DIR_BOT_ROOK: [-1, 0, 0, +1],
    DIR_TOP_BISP: [-1, -1, +1, -1],
    DIR_BOT_BISP: [-1, +1, +1, +1],
}
let highlightedSquares = [];
let piecesWithListener = [];
let squaresWithListener = [];
let whiteCapturedPieces = [];
let blackCapturedPieces = [];
let posOfPcsChking = []; // Postions of pieces checking the king whose turn it is.
let currPositions = defaultPositions;
let kingInCheck = false;
let [whiteKingHasMoved, whiteQRookHasMoved, whiteKRookHasMoved] = [false, false, false];
let [blackKingHasMoved, blackQRookHasMoved, blackKRookHasMoved] = [false, false, false];
let turn = 0;

for (row = CONSTS.MIN_INDEX; row <= CONSTS.MAX_INDEX; ++row) {
    for (col = CONSTS.MIN_INDEX; col <= CONSTS.MAX_INDEX; ++col) {
        let square = document.createElement('div');
        square.classList.add('square');
        square.id = `sq-${row}-${col}`;
        if ((row + col)%2) {
            square.classList.add('dark');
        } else {
            square.classList.add('light');
        }
        board.appendChild(square);
    }
}

// Helper data structures and functions --START--
function defaultObj(defaultFactory) {
    return new Proxy({}, {
        get: function(target, name) {
            if (!(name in target)) {
                target[name] = defaultFactory();
            }
            return target[name];
        },
        has: function(target, name) {
            return name in target;
        }
    });
}
// Helper data structures and functions --END--


// Square related functionality --START--
function highlightSquare(row, col, type) {
    let square = document.getElementById(`sq-${row}-${col}`);
    square.classList.add(`highlight-${type}`);
    highlightedSquares.push([square, type])
}

function clearHighlight(all=false) {
    let leftover = [];
    highlightedSquares.forEach(data => {
        if (data[1] != 'check' || all)
            data[0].classList.remove(`highlight-${data[1]}`)
        else
            leftover.push(data)
    });
    squaresWithListener.forEach(data => {
        if (data[1])
            data[0].removeEventListener('click', data[1]);
    });
    highlightedSquares = leftover;
}

async function placePiece(currX, currY, targX, targY, switchT=true) {
    let piece = document.getElementById(`pc-${currY}-${currX}`);
    for(let i=0; i<currPositions.length; ++i){
      if(currPositions[i].row == currY && currPositions[i].col == currX){
        currPositions[i].row = targY;
        currPositions[i].col = targX;
        break;
      }
    }
    let initSquare = document.getElementById(`sq-${currY}-${currX}`);
    let destSquare = document.getElementById(`sq-${targY}-${targX}`);
    
    switch (piece.classList[2]) {
        case 'king':
            if (piece.classList[1] == 'white')
                whiteKingHasMoved = true;
            else
                blackKingHasMoved = true;
            break;
        case 'rook':
            if (piece.classList[1] == 'white') {
                if (piece.classList[3] == 'queenside')
                    whiteQRookHasMoved = true;
                else
                    whiteKRookHasMoved = true;
            } else {
                if (piece.classList[3] == 'queenside')
                    blackQRookHasMoved = true;
                else
                    blackKRookHasMoved = true;
            }
            break;
        case 'pawn':
            if (targY == CONSTS.MIN_INDEX || targY == CONSTS.MAX_INDEX)
                await getPromotion(piece, piece.classList[1]);
            break;
    }
    clearHighlight(true);
    piece.id = `pc-${targY}-${targX}`;
    piece.style.top = `${targY * CONSTS.SQUARE_SIZE}px`;
    piece.style.left = `${targX * CONSTS.SQUARE_SIZE}px`;
    setTimeout(() => {
        destSquare.appendChild(piece);
        initSquare.innerHTML = '';
        switchT ? switchTurn() : null;
        currPositions[0].turn = turn;
        localStorage.currPositions = JSON.stringify(currPositions);
    }, CONSTS.MOVE_DELAY);
}

function addSquareClickListener(row, col, piece) {
    squaresWithListener = [];
    let square, highlightType;
    let listener = (e) => {
        square = e.currentTarget;
        highlightType = square.classList[2].split('-')[1];
        col2 = parseInt(square.id.split('-')[2]);
        row2 = parseInt(square.id.split('-')[1]);
        if (highlightType == 'kill')
            capturePiece(col2, row2);
        if (highlightType == 'castle') {
            file1 = col2 == 2 ? 0 : 7;
            file2 = col2 == 2 ? 3 : 5;
            placePiece(file1, row, file2, row, false);
        }
        placePiece(col, row, col2, row2);
    }
    highlightedSquares.forEach(([square, type]) => {
        if (type != 'clicked' && type != 'check') {
            square.addEventListener('click', listener);
            squaresWithListener.push([square, listener]);
        } else
            squaresWithListener.push([square, null]);
    });
}
// Square related functionality --END--


// Piece related functionality --START--
function getPossibleMoves(type, piece, row, col, legal=true, check=false) {
    let moves = [];
    let square;
    let repeatingPattern = (directionsTop, directionsBot) => {
        let didSomething = false;
        let [topLeftX, topLeftY, topRightX, topRightY] = [col, row, col, row];
        let [botLeftX, botLeftY, botRightX, botRightY] = [col, row, col, row];
        let [topLeftClosed, topRightClosed, botLeftClosed, botRightClosed] = [false, false, false, false];
        let [dxtl, dytl, dxtr, dytr] = [...directionsTop];
        let [dxbl, dybl, dxbr, dybr] = [...directionsBot];
        
        
        // Needs work, a queue would be better, to make it a standard BFS
        do {
            didSomething = false;
            if (topLeftX+dxtl >= CONSTS.MIN_INDEX && topLeftY+dytl >= CONSTS.MIN_INDEX && !topLeftClosed) {
                topLeftX += dxtl;
                topLeftY += dytl;
                square = document.getElementById(`sq-${topLeftY}-${topLeftX}`);
                if (!legal || (square.innerHTML != '' && square.firstChild.classList.contains(opponentType)))
                    moves.push([topLeftY, topLeftX, "kill"]);
                else if (!legal || square.innerHTML == '')
                    moves.push([topLeftY, topLeftX, "empty"]);
                topLeftClosed |= square.innerHTML != '';
                didSomething = true;
            }
            if (topRightX+dxtr <= CONSTS.MAX_INDEX && topRightY+dytr >= CONSTS.MIN_INDEX && !topRightClosed) {
                topRightX += dxtr;
                topRightY += dytr;
                square = document.getElementById(`sq-${topRightY}-${topRightX}`);
                if (!legal || (square.innerHTML != '' && square.firstChild.classList.contains(opponentType)))
                    moves.push([topRightY, topRightX, "kill"]);
                else if (!legal || square.innerHTML == '')
                    moves.push([topRightY, topRightX, "empty"]);
                topRightClosed |= square.innerHTML != '';
                didSomething = true;
            }
            if (botLeftX+dxbl >= CONSTS.MIN_INDEX && botLeftY+dybl <= CONSTS.MAX_INDEX && !botLeftClosed) {
                botLeftX += dxbl;
                botLeftY += dybl;
                square = document.getElementById(`sq-${botLeftY}-${botLeftX}`);
                if (!legal || (square.innerHTML != '' && square.firstChild.classList.contains(opponentType)))
                    moves.push([botLeftY, botLeftX, "kill"]);
                else if (!legal || square.innerHTML == '')
                    moves.push([botLeftY, botLeftX, "empty"]);
                botLeftClosed |= square.innerHTML != '';
                didSomething = true;
            }
            if (botRightX+dxbr <= CONSTS.MAX_INDEX && botRightY+dybr <= CONSTS.MAX_INDEX && !botRightClosed) {
                botRightX += dxbr;
                botRightY += dybr;
                square = document.getElementById(`sq-${botRightY}-${botRightX}`);
                if (!legal || (square.innerHTML != '' && square.firstChild.classList.contains(opponentType)))
                    moves.push([botRightY, botRightX, "kill"]);
                else if (!legal || square.innerHTML == '')
                    moves.push([botRightY, botRightX, "empty"]);
                botRightClosed |= square.innerHTML != '';
                didSomething = true;
            }
        } while (didSomething);
    }
    let opponentType = type == 'black' ? 'white' : 'black';
    let kingHasNotMoved = type == 'black' ? !blackKingHasMoved : !whiteKingHasMoved;
    let qSideRookHasNotMoved = type == 'black' ? !blackQRookHasMoved : !whiteQRookHasMoved;
    let kSideRookHasNotMoved = type == 'black' ? !blackKRookHasMoved : !whiteKRookHasMoved;
    let threatenedSquares = legal ? getThreatenedSquares(opponentType) : null;

    switch (piece) {
        case 'pawn':
            let highlightType;
            let dy = type == 'white' ? -1 : 1;
            let hasMoved = type == 'white' ? row != 6 : row != 1;
            for (let dx of [-1, 0, 1]) {
                console.log([row+dy, col+dx])
                square = document.getElementById(`sq-${row+dy}-${col+dx}`);
                if (dx == 0 && square.innerHTML == '' && legal) {
                    highlightType = row+dy == CONSTS.MIN_INDEX || row+dy == CONSTS.MAX_INDEX ? "promotion" : "empty";
                    moves.push([row+dy, col, highlightType]);
                    square = document.getElementById(`sq-${row+(2*dy)}-${col}`);
                    if (!hasMoved && square.innerHTML == '') 
                        moves.push([row+(2*dy), col, "empty"]);
                } else if (dx != 0) {
                    if (square != null) {
                        if (!legal || (square.innerHTML != '' && square.firstChild.classList.contains(opponentType))) 
                            moves.push([row+dy, col+dx, "kill"]);
                    }
                }
            }
            break;
        case 'bishop':
            repeatingPattern(CONSTS.DIR_TOP_BISP, CONSTS.DIR_BOT_BISP);
            break;
        case 'rook':
            repeatingPattern(CONSTS.DIR_TOP_ROOK, CONSTS.DIR_BOT_ROOK);
            break;
        case 'queen':
            repeatingPattern(CONSTS.DIR_TOP_ROOK, CONSTS.DIR_BOT_ROOK);
            repeatingPattern(CONSTS.DIR_TOP_BISP, CONSTS.DIR_BOT_BISP);
            break;
        case 'king':
            for (let dx of [-1, 0, 1]) {
                for (let dy of [-1, 0, 1]) {
                    if (dx == dy && dy == 0) continue;
                    square = document.getElementById(`sq-${row+dy}-${col+dx}`);
                    if (square != null && (!legal || !(`${row+dy}-${col+dx}` in threatenedSquares))) {
                        if (!legal || (square.innerHTML != '' && square.firstChild.classList.contains(opponentType)))
                            moves.push([row+dy, col+dx, "kill"]);
                        else if (!legal || square.innerHTML == '')
                            moves.push([row+dy, col+dx, "empty"]);
                    }
                }
            }
            
            // Check for Castling
            if (legal && kingHasNotMoved) {
                if (qSideRookHasNotMoved) {
                    if (document.getElementById(`sq-${row}-1`).innerHTML == '' &&
                        document.getElementById(`sq-${row}-2`).innerHTML == '' &&
                        document.getElementById(`sq-${row}-3`).innerHTML == '' &&
                        !(`${row}-2` in threatenedSquares) &&
                        !(`${row}-3` in threatenedSquares) &&
                        !(`${row}-4` in threatenedSquares)) {
                        moves.push([row, 2, "castle"]);
                    }
                }
                if (kSideRookHasNotMoved) {
                    if (document.getElementById(`sq-${row}-5`).innerHTML == '' &&
                        document.getElementById(`sq-${row}-6`).innerHTML == '' &&
                        !(`${row}-5` in threatenedSquares) &&
                        !(`${row}-6` in threatenedSquares) &&
                        !(`${row}-4` in threatenedSquares)) {
                        moves.push([row, 6, "castle"]);
                    }
                }
            }
            break;
        case 'knight':
            for (let dx of [-1, -2, 1, 2]) {
                for (let dy of [-1, -2, 1, 2]) {
                    if (Math.abs(dx) == Math.abs(dy)) continue;
                    square = document.getElementById(`sq-${row+dy}-${col+dx}`);
                    if (square != null) {
                        if (!legal || (square.innerHTML != '' && square.firstChild.classList.contains(opponentType)))
                            moves.push([row+dy, col+dx, "kill"]);
                        else if (!legal || square.innerHTML == '')
                            moves.push([row+dy, col+dx, "empty"]);
                    }
                }
            }
    }

    // Satisfy Check conditions, when in check
    if (legal && kingInCheck) {
        let legalMoves, illegalMoves;
        if (posOfPcsChking.length == 1 && piece != 'king') {
            legalMoves = [...getBlockingMoves(type, piece)];
            moves = moves.filter(move => legalMoves.includes(`${move[0]}-${move[1]}`));
        } else if (piece == 'king') {
            illegalMoves = [...getBlockingMoves(type, piece)]
            moves = moves.filter(move => !illegalMoves.includes(`${move[0]}-${move[1]}`) || posOfPcsChking.includes(`${move[0]}-${move[1]}`));
        } else if (posOfPcsChking.length > 1) {
            moves = [];
        }
    }

    if (moves.length > 0 && legal && !check)
        highlightSquare(row, col, "clicked");

    return moves;
}

function getBlockingMoves(type, targetPiece) {
    let king = document.querySelector(`.${type}.king`);
    let [_, kingRow, kingCol] = king.id.split('-').map(Number);
    let [chkRow, chkCol] = posOfPcsChking[0].split('-').map(Number);
    let piece = document.getElementById(`pc-${chkRow}-${chkCol}`).classList[2];
    let dx = kingRow > chkRow ? 1 : (kingRow < chkRow ? -1 : 0);
    let dy = kingCol > chkCol ? 1 : (kingCol < chkCol ? -1 : 0);
    let blockingMoves = [];
    
    if (piece == 'knight' || piece == 'pawn')
        return [`${chkRow}-${chkCol}`];

    while ((dx !== 0 && chkRow !== kingRow) || (dy !== 0 && chkCol !== kingCol)) {
        blockingMoves.push(`${chkRow}-${chkCol}`);
        chkRow += dx;
        chkCol += dy;
    }
    if (targetPiece == 'king') {
        while (chkRow >= CONSTS.MIN_INDEX && chkRow <= CONSTS.MAX_INDEX && chkCol >= CONSTS.MIN_INDEX && chkCol <= CONSTS.MAX_INDEX) {
            blockingMoves.push(`${chkRow}-${chkCol}`);
            chkRow += dx;
            chkCol += dy;
        }
    }

    return blockingMoves;
}

function getThreatenedSquares(type) {
    let threatenedSquares = defaultObj(() => []);
    
    document.querySelectorAll(`.${type}`).forEach(piece => {
        let [_, row, col] = piece.id.split('-');
        row = parseInt(row);
        col = parseInt(col);
        console.log([...piece.classList])
        let possMoves = getPossibleMoves(type, piece.classList[2], row, col, false);
        possMoves.forEach(move => {
            threatenedSquares[`${move[0]}-${move[1]}`].push(`${row}-${col}`)
        });
    });
    return threatenedSquares;
}

function capturePiece(col, row) {
    let piece = document.getElementById(`pc-${row}-${col}`);
    setTimeout(() => {
        piece.remove(); // This removes the piece from the DOM
        if (piece.classList.contains('black'))
            blackCapturedPieces.push(piece);
        else
            whiteCapturedPieces.push(piece);
    }, CONSTS.CAPTURE_DELAY);
}

function getPromotion(piece, type) {
    return new Promise((resolve) => {
        let options = `
            <div class="promote-option">
                <img id="pr-queen" src="./images/${type}-queen.png" alt="">
                <p>Queen</p>
            </div>
            <div class="promote-option">
                <img id="pr-rook" src="./images/${type}-rook.png" alt="">
                <p>Rook</p>
            </div>
            <div class="promote-option">
                <img id="pr-bishop" src="./images/${type}-bishop.png" alt="">
                <p>Bishop</p>
            </div>
            <div class="promote-option">
                <img id="pr-knight" src="./images/${type}-knight.png" alt="">
                <p>Knight</p>
            </div>
        `;
        promotionPrompt.innerHTML = options;
        promotionPrompt.style.display = 'grid';
    
        document.querySelectorAll(".promote-option > img").forEach(option => {
            option.addEventListener('click', function() {
                const pieceType = this.id.split('-')[1];
                promotePawn(piece, type, pieceType);
                resolve();
            });
        });
    });
}

function promotePawn(piece, type, newPiece) {
    piece.src = `./images/${type}-${newPiece}.png`;
    piece.classList.remove('pawn');
    piece.classList.add(newPiece);
    promotionPrompt.style.display = 'none';
}

function addPieceClickListener(type) {
    let piece, possMoves, row, col;
    let listener = (e) => {
        piece = e.target;
        [_, row, col] = piece.id.split('-');
        row = parseInt(row);
        col = parseInt(col);
        clearHighlight();
        possMoves = getPossibleMoves(type, piece.classList[2], row, col);
        possMoves.forEach(move => {
            highlightSquare(move[0], move[1], move[2]);
        });
        addSquareClickListener(row, col, piece);
    }
    document.querySelectorAll(`.${type}`).forEach(element => {
        element.addEventListener('click', listener);
        piecesWithListener.push([element, listener]);
    });
}
// Piece related functionality --END--


// Other functionality --START--
function switchTurn() {
    let currentPlayer = ['white', 'black'][turn];
    turn ^= 1;
    let nextPlayer = ['white', 'black'][turn];
    turnDisplay.innerHTML = nextPlayer.charAt(0).toUpperCase() + nextPlayer.slice(1);
    isKingInCheck(nextPlayer);
    isGameOver(nextPlayer);
    piecesWithListener.forEach(data => data[0].removeEventListener('click', data[1]))
    addPieceClickListener(nextPlayer);
}

function isKingInCheck(type) {
    let opponentType = type == 'black' ? 'white' : 'black';
    console.log(type)
    let [_, row, col] = document.querySelector(`.${type}.king`).id.split('-');
    let threatenedSquares = getThreatenedSquares(opponentType);
    
    posOfPcsChking = threatenedSquares[`${row}-${col}`];
    if (posOfPcsChking.length > 0) {
        kingInCheck = true;
        highlightSquare(row, col, 'check');
    } else
        kingInCheck = false;

    return kingInCheck;
}

function isCheckOrStaleMate(currentPlayer) {
    let legalMoves = []
    
    document.querySelectorAll(`.${currentPlayer}`).forEach(piece => {
        let [_, row, col] = piece.id.split('-');
        row = parseInt(row);
        col = parseInt(col);
        let possMoves = getPossibleMoves(currentPlayer, piece.classList[2], row, col, true, true);
        possMoves.forEach(move => {
            legalMoves.push(`${row}-${col}`);
        });
    });
    
    if (kingInCheck && legalMoves.length == 0)
        return [['black', 'white'][turn], 'checkmate'];
    else if (!kingInCheck && legalMoves.length == 0)
        return [null, 'stalemate'];
    return [null, null];
}

function isGameOver(currentPlayer) {
    let [winner, checkOrStaleMate] = isCheckOrStaleMate(currentPlayer);
    if (checkOrStaleMate == 'checkmate')
        alert(`${winner} won by Checkmate.`);
    else if(checkOrStaleMate == 'stalemate')
        alert(`Draw by Stalemate.`);
    // More Endgame conditions coming.
}

function resetGame() {
    localStorage.currPositions = "";
    location.reload();
}
// Other functionality --END--


function main() {
    if(localStorage.currPositions !== undefined && localStorage.currPositions !== ""){
      currPositions = JSON.parse(localStorage.currPositions);
      turn = currPositions[0].turn;
    }
    currPositions.forEach(pos => {
        let img = document.createElement('img');
        img.src = `./images/${pos.src}.png`;
        img.classList.add('piece');
        img.id = `pc-${pos.row}-${pos.col}`;
        let [type, name] = pos.src.split('-');
        img.classList.add(`${type}`);
        img.classList.add(`${name}`);
        
        // For Castling Later
        if (name == 'rook') {
            if (pos.col == CONSTS.MIN_INDEX)
                img.classList.add('queenside');
            else
                img.classList.add('kingside');
        }
        
        img.style.width = `${CONSTS.SQUARE_SIZE}px`;
        img.style.height = `${CONSTS.SQUARE_SIZE}px`;
        img.style.top = `${pos.row * CONSTS.SQUARE_SIZE}px`;
        img.style.left = `${pos.col * CONSTS.SQUARE_SIZE}px`;

        let initSquare = document.getElementById(`sq-${pos.row}-${pos.col}`);
        initSquare.appendChild(img);
    });

    //switchTurn(); -> Might be easier to modify this function.
    isKingInCheck(["white", "black"][currPositions[0].turn]);
    isGameOver(["white", "black"][currPositions[0].turn]);
    turnDisplay.innerHTML = currPositions[0].turn == 0 ? "White" : "Black";
    addPieceClickListener(["white", "black"][currPositions[0].turn]);
}

window.onload = main;