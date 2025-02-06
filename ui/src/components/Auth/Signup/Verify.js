import { useContext, useEffect, useState } from "react";
import classes from "./Signup.module.css";
import styled from "styled-components";
import Lottie from "react-lottie";
import * as animationData from "../../../assets/lottie/verify.json";
import { Button, Typography } from "@mui/material";
import SignInIcon from "@mui/icons-material/Login";
import { useNavigate, useParams } from "react-router-dom";
import { AuthenticationContext } from "../../../services/Authentication/Authentication.context";

const LottieContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  height: 100%;
  width: 100%;
  @media (max-width: 768px) {
    width: 300px;
  }
`;

const VerifiedContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  height: 400px;
  text-align: center;
  width: 400px;
`;

const VerifiedImage = styled.img`
  width: 90%;
  height: 90%;
  object-fit: cover;
`;

const Verify = ({ title }) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const { verificationToken } = useParams();
  const { onVerify } = useContext(AuthenticationContext);

  useEffect(() => {
    document.title = title;
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  }, []);

  useEffect(() => {
    if (!verificationToken) {
      return navigate("/auth/signin");
    }

    setTimeout(() => {
      onVerify(
        verificationToken,
        () => {
          setLoading(false);
          setSuccess(true);
        },
        (error) => {
          setLoading(false);
          setError(error?.message || "Account Verification failed");
        },
        false,
        false
      );
    }, 3000);
  }, [verificationToken]);

  return (
    <div>
      {loading && (
        <LottieContainer>
          <Lottie
            isClickToPauseDisabled
            width={400}
            options={{
              loop: true,
              autoplay: true,
              animationData: animationData,
            }}
          />
        </LottieContainer>
      )}

      {!loading && success && (
        <VerifiedContainer>
          <VerifiedImage
            src={require("../../../assets/verified.png")}
            alt="..."
          />
          <Typography variant={"h6"} sx={{ mb: 2 }}>
            Account Verified Successfully
          </Typography>
          <Button
            onClick={() => navigate("/auth/signin")}
            variant="contained"
            endIcon={<SignInIcon />}
          >
            Click here to Sign In
          </Button>
        </VerifiedContainer>
      )}

      {!loading && error && (
        <VerifiedContainer>
          <VerifiedImage
            src={require("../../../assets/verification_failed.png")}
            alt="..."
          />
          <Typography variant="h6" sx={{ mb: 2, color: "red" }}>
            {error}
          </Typography>
          <Button
            onClick={() => navigate("/auth/signin")}
            variant="contained"
            endIcon={<SignInIcon />}
          >
            GO BACK TO SIGN IN / SIGN UP
          </Button>
        </VerifiedContainer>
      )}
    </div>
  );
};

export default Verify;
