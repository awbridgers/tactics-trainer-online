import styled from 'styled-components';
import blackRook from '../images/blackRook2.png';
import blackKnight from '../images/blackKnight2.png';
import blackBishop from '../images/blackBishop2.png';
import blackQueen from '../images/blackQueen2.png';
import whiteRook from '../images/whiteRook2.png';
import whiteKnight from '../images/whiteKnight2.png';
import whiteBishop from '../images/whiteBishop2.png';
import whiteQueen from '../images/whiteQueen2.png';
import {FaX} from 'react-icons/fa6';

type Props = {
  color: 'w' | 'b';
  onClick: (e: React.MouseEvent) => void;
  cancel: () => void;
};
const Promo = ({color, onClick, cancel}: Props) => (
  <Container>
    <Box id="q" onClick={onClick}>
      <img
        src={color === 'w' ? whiteQueen : blackQueen}
        alt={color === 'w' ? 'White Queen' : 'Black Queen'}
      />
    </Box>
    <Box id="r" onClick={onClick}>
      <img
        src={color === 'w' ? whiteRook : blackRook}
        alt={color === 'w' ? 'White Rook' : 'Black Rook'}
      />
    </Box>
    <Box id="b" onClick={onClick}>
      <img
        src={color === 'w' ? whiteBishop : blackBishop}
        alt={color === 'w' ? 'White Bishop' : 'Black Bishop'}
      />
    </Box>
    <Box id="n" onClick={onClick}>
      <img
        src={color === 'w' ? whiteKnight : blackKnight}
        alt={color === 'w' ? 'White Knight' : 'Black Knight'}
      />
    </Box>
    <div className="cancel">
      <Cancel onClick={cancel}>
        <FaX style={{fontSize: '20px'}} />
      </Cancel>
    </div>
  </Container>
);

const Box = styled.div`
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background-color: yellow;
  }
  img {
    width: 80%;
    margin: auto;
  }
`;
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #a2a3a2;
  position: absolute;
  top: 0px;
  z-index: 1;
  .cancel {
    background-color: grey;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;
const Cancel = styled.button`
  border-radius: 10px;
  background-color: #a2a3a2;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 500;
  width: 500;
  &:hover {
    background-color: yellow;
  }
`;

export default Promo;
