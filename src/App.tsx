import styled from 'styled-components';
import {Chess, PieceSymbol, Square} from 'chess.js';
import React, {useRef, useState} from 'react';
import blackPawn from './images/blackPawn2.png';
import blackRook from './images/blackRook2.png';
import blackKnight from './images/blackKnight2.png';
import blackBishop from './images/blackBishop2.png';
import blackQueen from './images/blackQueen2.png';
import blackKing from './images/blackKing2.png';
import whitePawn from './images/whitePawn2.png';
import whiteRook from './images/whiteRook2.png';
import whiteKnight from './images/whiteKnight2.png';
import whiteBishop from './images/whiteBishop2.png';
import whiteQueen from './images/whiteQueen2.png';
import whiteKing from './images/whiteKing2.png';

const getImage = (piece: PieceSymbol, color: 'w' | 'b') => {
  switch (piece) {
    case 'p':
      return color === 'w' ? whitePawn : blackPawn;
    case 'b':
      return color === 'w' ? whiteBishop : blackBishop;
    case 'n':
      return color === 'w' ? whiteKnight : blackKnight;
    case 'r':
      return color === 'w' ? whiteRook : blackRook;
    case 'q':
      return color === 'w' ? whiteQueen : blackQueen;
    case 'k':
      return color === 'w' ? whiteKing : blackKing;
    default:
      return whitePawn;
  }
};

function App() {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [targetSquares, setTargetSquares] = useState<Set<string> | null>(null);
  const [promotion, setPromotion] = useState<Omit<PieceSymbol, 'k'|'p'> | ''>('')
  const chess = useRef(new Chess());

  const handleClick = (e: React.MouseEvent) => {
    if (!selectedSquare) {
      const squareInfo = chess.current.get(e.currentTarget.id as Square);
      if(squareInfo && squareInfo.color === chess.current.turn()){
        setSelectedSquare(e.currentTarget.id);
        const moveList = chess.current
          .moves({square: e.currentTarget.id as Square, verbose: true})
          .map((x) => x.to);
        setTargetSquares(new Set(moveList));
      }
      
    } else {
      if(targetSquares?.has(e.currentTarget.id)){
        //this is a legal move!
        chess.current.move({from: selectedSquare, to: e.currentTarget.id})

      }
      setSelectedSquare(null);
      setTargetSquares(null);
    }
  };
  return (
    <Container>
      <div className="title">Tactics Trainer</div>
      <div className="board">
        {chess.current &&
          chess.current.board().map((row, i) => (
            <BoardRow key={i}>
              {row.map((square, j) => (
                <BoardSquare
                  $row={i}
                  $col={j}
                  key={j}
                  $selected={
                    selectedSquare === `${String.fromCharCode(j + 97)}${8 - i}`
                  }
                  $targetted={
                    targetSquares
                      ? targetSquares.has(
                          `${String.fromCharCode(j + 97)}${8 - i}`
                        )
                      : false
                  }
                  id={`${String.fromCharCode(j + 97)}${8 - i}`}
                  onClick={handleClick}
                  //onDragEnter={handleDragEnter}
                >
                  {square && (
                    <img
                      src={getImage(square.type, square.color)}
                      alt={`${square.color},${square.type}`}
                      //onDragStart={(e)=>handleDragStart(e,{i,j})}
                      //draggable
                    />
                  )}
                </BoardSquare>
              ))}
            </BoardRow>
          ))}
      </div>
    </Container>
  );
}

const BoardRow = styled.div`
  display: flex;
  flex-direction: row;
`;
const BoardSquare = styled.div<{
  $row: number;
  $col: number;
  $selected: boolean;
  $targetted: boolean;
}>`
  background-color: ${(props) =>
    props.$row % 2 === 1
      ? props.$col % 2 === 0
        ? '#B88762'
        : '#EDD6B0'
      : props.$col % 2 === 0
      ? '#EDD6B0'
      : '#B88762'};
  outline: ${(props) =>
    props.$selected
      ? '4px solid yellow'
      : props.$targetted
      ? '4px solid red'
      : '0px'};
  box-sizing: border-box;
  outline-offset: -4px;
  height: 60px;
  width: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  img {
    width: 80%;
    margin: auto;
  }
`;
const Container = styled.div`
  text-align: center;
  height: 100vh;
  .title {
    font-size: 40px;
    color: white;
  }
  .board {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
`;

export default App;
