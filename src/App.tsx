import styled from 'styled-components';
import {firebaseConfig} from './firebaseConfig';
import {initializeApp} from 'firebase/app';
import {Database, get, getDatabase, ref} from 'firebase/database';
import {Chess, PieceSymbol, Square, Move} from 'chess.js';
import React, {useEffect, useRef, useState} from 'react';
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
import {PGNFormat, PGNMove} from './types';

const app = initializeApp(firebaseConfig);
const blankPGN: PGNFormat = {
  fen: '8/8/8/8/8/8/8/8 w - - 0 1',
  pgn: [],
};
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
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [playerMove, setPlayerMove] = useState<boolean>(false);
  const [solution, setSolution] = useState<PGNMove[]>([]);
  const [tacticActive, setTacticActive] = useState<boolean>(false);
  const [attemptedMove, setAttemptedMove] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [moveResult, setMoveResult] = useState<boolean | null>(null);
  const [loadNewTactic, setLoadNewTactic] = useState<boolean>(true);
  const promoInfo = useRef<{to: Square; from: Square} | null>(null);
  const chess = useRef(new Chess());
  const db = useRef<Database>(getDatabase(app));
  const currentTactic = useRef<PGNFormat>(blankPGN);
  const moveHistory = useRef<string>('');

  //handle the seleciton of squares for the movement of pieces
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
        //this is a legal move!
        //store the current fen so we can comeback to it later
        moveHistory.current = chess.current.fen();
        const info = targetSquares.get(e.currentTarget.id as Square);
        if (info && info.promotion) {
          setShowPromo(true);
          promoInfo.current = {
            from: selectedSquare,
            to: e.currentTarget.id as Square,
          };
        } else {
          movePiece(selectedSquare, e.currentTarget.id as Square, 'q');
        }
      }
      setSelectedSquare(null);
      setTargetSquares(null);
    }
  };
  const movePiece = (from: Square, to: Square, promotion: string) => {
    //store the previous position
    moveHistory.current = chess.current.fen();
    const move = chess.current.move({to, from, promotion});
    setAttemptedMove(move.san);
  };
  //handle the promotion of pieces
  const promotePiece = (e: React.MouseEvent) => {
    if (promoInfo.current) {
      const {to, from} = promoInfo.current;
      movePiece(to, from, e.currentTarget.id);
      setShowPromo(false);
      promoInfo.current = null;
    }
  };
  //cancel a move that involves a promotion
  const cancelPromotion = () => {
    setSelectedSquare(null);
    setTargetSquares(null);
    setShowPromo(false);
    promoInfo.current = null;
  };
  //load a tactic
  useEffect(() => {
    const loadTactic = async () => {
      const random = Math.floor(Math.random() * 4740); //NOTE: 4740 is CURRENT number of tactics in the DB
      const fetch = await get(ref(db.current, `tacticsList/${random}`));
      const tactic: PGNFormat = await fetch.val();
      chess.current.load(tactic.fen);
      setPlayerColor(chess.current.turn());
      setAttemptedMove(null);
      setPlayerMove(true);
      setSolution(tactic.pgn);
      setTacticActive(true);
      currentTactic.current = tactic;
    };
    if (loadNewTactic) {
      loadTactic();
      setLoadNewTactic(false);
    }
  }, [loadNewTactic]);
  //Determine if the player's move is correct
  useEffect(() => {
    if (attemptedMove && tacticActive) {
      const theAnswer = [...solution];
      if (theAnswer[0].move.includes(attemptedMove)) {
        //this move is correct!
        setMoveResult(true);
        if (theAnswer.length === 1) {
          //the last move of the solution
          setTacticActive(false);
          setShowSolution(false);
        } else {
          //there are more moves in the solution
          theAnswer.shift();
          setSolution(theAnswer);
          setPlayerMove(false);
          setAttemptedMove(null);
        }
      } else {
        //the move is incorrect
        setMoveResult(false);
        setTimeout(() => {
          chess.current.load(moveHistory.current);
          setAttemptedMove(null);
          setPlayerMove(true);
        }, 1000);
      }
    }
  }, [attemptedMove, tacticActive, solution]);
  //the computer move
  useEffect(() => {
    if (!playerMove && tacticActive) {
      const theAnswer = [...solution];
      //the computer makes the next move in the solution
      const computerMove = theAnswer.shift();
      if (computerMove) {
        setTimeout(() => {
          chess.current.move(computerMove.move);
          setSolution(theAnswer);
          setPlayerMove(true);
        }, 500);
      }
    }
  }, [playerMove, tacticActive, solution]);
  return (
    <Container>
      <div className="title">Tactics Trainer</div>

      <div className="board">
        <div className="subTitle">
          {playerColor === 'w' ? 'White' : 'Black'} to play
        </div>

        {chess.current &&
          chess.current.board().map((row, i) => (
            <BoardRow key={i}>
              {row.map((square, j) => {
                const id = `${String.fromCharCode(j + 97)}${8 - i}`;
                return (
                  <BoardSquare
                    $squareColor={
                      i % 2 === 1
                        ? j % 2 === 0
                          ? 'dark'
                          : 'light'
                        : j % 2 === 0
                        ? 'light'
                        : 'dark'
                    }
                    key={j}
                    $selected={selectedSquare === id}
                    $targetted={
                      targetSquares ? targetSquares.has(id as Square) : false
                    }
                    id={id}
                    onClick={handleClick}
                    //onDragEnter={handleDragEnter}
                  >
                    {i === 7 && <div className="file">{id[0]}</div>}
                    {j === 0 && <div className="rank">{id[1]}</div>}
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
        <Results $color={!!moveResult}>
          {moveResult === false && <>Incorrect, keep trying!</>}
          {moveResult === true && <>Great Job!</>}
        </Results>
      </div>
    </Container>
  );
}
const Results = styled.div<{$color: boolean}>`
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  color: ${(props) => (props.$color ? 'green' : 'red')};
`;
const BoardRow = styled.div`
  display: flex;
  flex-direction: row;
`;
const BoardSquare = styled.div<{
  $squareColor: 'dark' | 'light';
  $selected: boolean;
  $targetted: boolean;
}>`
  background-color: ${props=>props.$squareColor === 'light' ? '#EDD6B0': '#B88762'};
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
  color: ${props=>props.$squareColor === 'light' ? '#B88762' : '#EDD6B0'};
  img {
    width: 80%;
    margin: auto;
  }
  .file {
    position: absolute;
    bottom: 2px;
    right: 2px;
  }
  .rank {
    position: absolute;
    top: 2px;
    left: 2px;
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
  .subTitle {
    font-size: 25px;
    color: white;
  }
`;

export default App;
