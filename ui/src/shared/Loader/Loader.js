import styles from "./Loader.module.css";
import ReactDOM from "react-dom";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { loaderActions } from "../../store/Loader.slice";
import { styled } from "styled-components";
import Lottie from "react-lottie";
import * as animationData from "../../assets/lottie/loading.json";

export const showLoader = (dispatch) => {
  dispatch(loaderActions.showLoader());
};

export const hideLoader = (dispatch) => {
  dispatch(loaderActions.hideLoader());
};

const portalElement = document.getElementById("loader-section");

const LottieContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  height: 100%;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.5);
  z-index: 99999;
  @media (max-width: 768px) {
    width: 300px;
  }
`;

const Loader = () => {
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (isLoading) {
      // setScrollY(-window.scrollY);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      // window.scrollTo(0, parseInt(scrollY || "0") * -1);
      // setScrollY(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  return (
    isLoading && (
      <>
        {ReactDOM.createPortal(
          <LottieContainer>
            <Lottie
              isClickToPauseDisabled
              width={window.innerWidth < 800 ? 350 : 600}
              options={{
                loop: true,
                autoplay: true,
                animationData: animationData,
              }}
            />
          </LottieContainer>,
          portalElement
        )}
      </>
    )
  );
};

export default Loader;
