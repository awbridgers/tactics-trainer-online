import styled from 'styled-components';
import {Chess} from 'chess.js';
import {useRef} from 'react';

function App() {
  const chess = useRef(new Chess());
  return (
    <Container>
      <div className="title">Tactics Trainer</div>
      <div className="board">
        {chess.current &&
          chess.current.board().map((row, i) => (
            <BoardRow>
              {row.map((square, j) => (
                <BoardSquare row={i} col={j} />
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
const BoardSquare = styled.div<{row: number; col: number}>`
  background-color: ${(props) =>
    props.row % 2 === 1
      ? props.col % 2 === 0
        ? '#B88762'
        : '#EDD6B0'
      : props.col % 2 === 0
      ? '#EDD6B0'
      : '#B88762'};
  height: 50px;
  width: 50px;
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
