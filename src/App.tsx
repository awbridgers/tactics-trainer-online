import styled from 'styled-components';
import {firebaseConfig} from './firebaseConfig';
import {initializeApp} from 'firebase/app';
import {Database, get, getDatabase, ref} from 'firebase/database';
import {Chess, PieceSymbol, Square, Move} from 'chess.js';
import React, {useEffect, useRef, useState} from 'react';
import {GoDotFill} from 'react-icons/go';

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
import { useMediaQuery } from 'react-responsive'


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
  const [moveResult, setMoveResult] = useState<PGNMove[]>([]);
  const [loadNewTactic, setLoadNewTactic] = useState<boolean>(true);
  const [prevMove, setPrevMove] = useState<{to: Square, from: Square} | null>()
  const promoInfo = useRef<{to: Square; from: Square} | null>(null);
  const chess = useRef(new Chess());
  const db = useRef<Database>(getDatabase(app));
  const currentTactic = useRef<PGNFormat>(blankPGN);
  const moveHistory = useRef<string>('');
  const isMobile = useMediaQuery({ maxWidth: 550 })

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
      movePiece(from, to, e.currentTarget.id);
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
  const retry = () => {
    setPlayerMove(true);
    setTacticActive(true);
    setShowSolution(false);
    setSolution(currentTactic.current.pgn);
    setSelectedSquare(null);
    setTargetSquares(null);
    setAttemptedMove(null);
    setPrevMove(null)
    setMoveResult([]);
    chess.current.load(currentTactic.current.fen);
  };
  //load a tactic
  useEffect(() => {
    const loadTactic = async () => {
      const random = Math.floor(Math.random() * 4740); //NOTE: 4740 is CURRENT number of tactics in the DB
      const fetch = await get(ref(db.current, `tacticsList/${random}`));
      const tactic: PGNFormat = await fetch.val();
      chess.current.load(tactic.fen);
      console.log(chess.current.history())
      setPlayerColor(chess.current.turn());
      setAttemptedMove(null);
      setPlayerMove(true);
      setSolution(tactic.pgn);
      setTacticActive(true);
      setPrevMove(null);
      setMoveResult([])
      currentTactic.current = tactic;
      console.log(isMobile)
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
        setMoveResult([...moveResult, theAnswer[0]]);
        if (theAnswer.length === 1) {
          //the last move of the solution
          setTacticActive(false);
          setShowSolution(false);
          setSolution([]);
        } else {
          //there are more moves in the solution
          theAnswer.shift();
          setSolution(theAnswer);
          setPlayerMove(false);
          setAttemptedMove(null);
        }
      } else {
        //the move is incorrect
        
        setTimeout(() => {
          chess.current.load(moveHistory.current);
          setAttemptedMove(null);
          setPlayerMove(true);
        }, 1000);
      }
    }
  }, [attemptedMove, tacticActive, solution, moveResult]);
  //the computer move
  useEffect(() => {
    if (!playerMove && tacticActive) {
      const theAnswer = [...solution];
      //the computer makes the next move in the solution
      const computerMove = theAnswer.shift();
      if (computerMove) {
        setTimeout(() => {
          const nextMove = chess.current.move(computerMove.move);
          //console.log(nextMove)
          setSolution(theAnswer);
          setMoveResult([...moveResult, computerMove])
          setPlayerMove(true);
        }, 500);
      }
    }
  }, [playerMove, tacticActive, solution, moveResult]);
  // Show the solution is the button is pressed
  useEffect(() => {
    if (tacticActive && showSolution) {
      //console.log('test');
      if (solution.length > 0) {
        const theAnswer = [...solution];
        const nextMove = theAnswer.shift();
        setTimeout(() => {
          chess.current.move(nextMove!.move);
          setSolution(theAnswer);
          setMoveResult([...moveResult, nextMove!])
        }, 1000);
      } else {
        setShowSolution(false);
        setTacticActive(false);
      }
    }
  }, [tacticActive, showSolution, solution, moveResult]);
  useEffect(()=>{
    if(tacticActive){
      const history = chess.current.history({verbose: true});
      if(history.length > 0){
        const {to, from} = history[history.length-1]
        setPrevMove({to, from})
      }
    }

  }, [tacticActive,attemptedMove, solution])
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
                    $mobile = {isMobile}
                    key={j}
                    $selected={selectedSquare === id}
                    id={id}
                    onClick={handleClick}
                    //onDragEnter={handleDragEnter}
                  >
                    {targetSquares && targetSquares.has(id as Square) && (
                      <GoDotFill className="dot" />
                    )}
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
                    {prevMove && (prevMove.to === id || prevMove.from === id) && <PrevMove/>}
                  </BoardSquare>
                );
              })}
            </BoardRow>
          ))}
        <Results>
          {moveResult.map(x=><div className = 'move'>{x.move}</div>)}
        </Results>
      </div>
      <Controls $mobile = {isMobile}>
        <button
          onClick={() =>
            window.open(
              `https://lichess.org/analysis/${currentTactic.current.fen}`
            )
          }
        >
          Analysis
        </button>
        {solution.length > 0 && (
          <button disabled={showSolution} onClick={() => setShowSolution(true)}>
            View Solution
          </button>
        )}
        {solution.length === 0 && <button onClick={retry}>Retry</button>}
        <button disabled={showSolution || tacticActive} onClick = {()=>setLoadNewTactic(true)}>Next Tactic</button>
      </Controls>
    </Container>
  );
}
const PrevMove = styled.div`
  background-color: yellow;
  opacity: .3;
  height: 100%;
  width: 100%;
  position: absolute;
`
const Results = styled.div`
  height: 30px;
  display: flex;
  flex-direction: row wrap;
  justify-content: center;
  align-items: center;
  font-size: 18px;
  color: white;
  .move{
    margin: 0px 5px;
  }
`;
const BoardRow = styled.div`
  display: flex;
  flex-direction: row;
`;
const BoardSquare = styled.div<{
  $squareColor: 'dark' | 'light';
  $selected: boolean;
  $mobile: boolean;
}>`
  background-color: ${(props) =>
    props.$squareColor === 'light' ? '#EDD6B0' : '#B88762'};
  outline: ${(props) => (props.$selected ? '4px solid yellow' : '0px')};
  box-sizing: border-box;
  position: relative;
  outline-offset: -4px;
  height: ${(props)=>props.$mobile ? `calc(100vw / 8)` : '65px'};
  width: ${(props)=>props.$mobile ? `calc(100vw / 8)` : '65px'};
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${(props) => (props.$squareColor === 'light' ? '#B88762' : '#EDD6B0')};
  img {
    width: 80%;
    margin: auto;
    z-index: 2;
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
  .dot {
    color: red;
    position: absolute;
    opacity: 0.5;
    z-index: 5;
  }
`;
const Controls = styled.div<{$mobile: boolean}>`
  display: flex;
  flex-direction: ${props=>props.$mobile ? 'column' : 'row'};
  width: 100%;
  margin: auto;
  justify-content: center;
  align-items: center;
  button {
    height: 50px;
    width: 100px;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 20px;
  }
`;
const Container = styled.div`
  text-align: center;
  height: 100vh;
  .title {
    font-size: 30px;
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
