import styled from "styled-components";
import { useEffect } from "react";
import NotFoundImage from "../../assets/not_found.png";

const LottieContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  height: 500px;
  width: 500px;
  @media (max-width: 768px) {
    width: 300px;
  }
`;

const PageNotFound = ({ title }) => {
  useEffect(() => {
    document.title = title;
  }, []);
  return (
    <LottieContainer>
      <img
        alt="not found"
        src={NotFoundImage}
        style={{
          height: 500,
          width: 500,
        }}
      />
    </LottieContainer>
  );
};

export default PageNotFound;
