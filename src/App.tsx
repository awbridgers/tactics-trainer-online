import styled from 'styled-components';
import {Chess, PieceSymbol, Square, Move} from 'chess.js';
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
import Promo from './Components/Promo';

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
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [targetSquares, setTargetSquares] = useState<Map<
    Square,
    Omit<Move, 'to'>
  > | null>(null);
  const [showPromo, setShowPromo] = useState<boolean>(false);
  const promoInfo = useRef<{to: Square; from: Square} | null>(null);
  const chess = useRef(new Chess('rk1q4/ppp2P1P/8/8/8/8/6P1/3QK2R w K - 0 1'));

  const handleClick = (e: React.MouseEvent) => {
    if (!selectedSquare) {
      const squareInfo = chess.current.get(e.currentTarget.id as Square);
      if (squareInfo && squareInfo.color === chess.current.turn()) {
        setSelectedSquare(e.currentTarget.id as Square);
        const moveList: [Square, Omit<Move, 'to'>][] = chess.current
          .moves({square: e.currentTarget.id as Square, verbose: true})
          .map((x) => {
            const {to, ...details} = x;
            return [to, details];
          });
        setTargetSquares(new Map(moveList));
      }
    } else {
      if (targetSquares?.has(e.currentTarget.id as Square)) {
        console.log('test');
        //this is a legal move!
        const info = targetSquares.get(e.currentTarget.id as Square);
        if (info && info.promotion) {
          setShowPromo(true);
          promoInfo.current = {
            from: selectedSquare,
            to: e.currentTarget.id as Square,
          };
        } else {
          chess.current.move({from: selectedSquare, to: e.currentTarget.id});
        }
        
      }
      setSelectedSquare(null);
        setTargetSquares(null);
    }
  };
  const promotePiece = (e: React.MouseEvent) => {
    console.log(e.currentTarget.id);

    if (promoInfo.current) {
      console.log(promoInfo.current);
      const {to, from} = promoInfo.current;
      chess.current.move({to, from, promotion: e.currentTarget.id});
      setShowPromo(false);

      promoInfo.current = null;
    }
  };
  const cancelPromotion = () => {
    setSelectedSquare(null);
    setTargetSquares(null);
    setShowPromo(false);
    promoInfo.current = null;
  };
  return (
    <Container>
      <div className="title">Tactics Trainer</div>
      <div className="board">
        {chess.current &&
          chess.current.board().map((row, i) => (
            <BoardRow key={i}>
              {row.map((square, j) => {
                const id = `${String.fromCharCode(j + 97)}${8 - i}`;
                return (
                  <BoardSquare
                    $row={i}
                    $col={j}
                    key={j}
                    $selected={selectedSquare === id}
                    $targetted={
                      targetSquares ? targetSquares.has(id as Square) : false
                    }
                    id={id}
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
                    {showPromo && promoInfo.current?.to === id && (
                      <Promo
                        color={chess.current.turn()}
                        onClick={promotePiece}
                        cancel={() => cancelPromotion()}
                      />
                    )}
                  </BoardSquare>
                );
              })}
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
  position: relative;
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
