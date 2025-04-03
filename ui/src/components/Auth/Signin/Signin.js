import { useContext, useEffect, useState } from "react";
import classes from "./Signin.module.css";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthenticationContext } from "../../../services/Authentication/Authentication.context";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import SignInIcon from "@mui/icons-material/Login";
import ResetIcon from "@mui/icons-material/RestartAlt";
import { useDispatch } from "react-redux";
import Swal from "sweetalert2";
import GoogleLogin, { GoogleLogout, useGoogleLogout } from "react-google-login";
import { userRole } from "../../../utility/helper";
import { useGridRegisterPipeApplier } from "@mui/x-data-grid/hooks/core/pipeProcessing";
import { loaderActions } from "../../../store/Loader.slice";

const errors = {
  emailRequired: "Email required",
  passwordRequired: "Password required",
};

const commonInputFieldProps = {
  value: "",
  focused: false,
  error: false,
  errorMessage: "",
};

const defaultInputState = {
  email: {
    ...commonInputFieldProps,
  },
  password: {
    ...commonInputFieldProps,
  },
};

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const Signin = ({ title }) => {
  const [inputs, setInputs] = useState(defaultInputState);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const [forgotPassModal, setForgotPassModal] = useState(false);
  const [forgotPassLoading, setForgotPassLoading] = useState(false);
  const [forgotPassEmail, setForgotPassEmail] = useState(null);
  const [forgotPassError, setForgotPassError] = useState(null);
  const [forgotPassSuccess, setForgotPassSuccess] = useState(null);
  const dispatch = useDispatch();
  let redirect = searchParams.get("redirect");

  const {
    onSignin,
    userData,
    onLogout,
    onGoogleSignin,
    onResetPassword,
    onResendVerificationLink,
  } = useContext(AuthenticationContext);

  useEffect(() => {
    document.title = title;
  }, []);

  const onValueChangeHandler = (e) => {
    const { name, value } = e.target;
    setInputs((prevState) => ({
      ...prevState,
      [name]: {
        ...prevState[name],
        error: false,
        errorMessage: "",
        value,
      },
    }));
  };

  const onSubmitForm = (e) => {
    e.preventDefault();

    let hadErrors = false;
    const setErrorMessage = (name, message) => {
      setInputs((prevState) => ({
        ...prevState,
        [name]: {
          ...prevState[name],
          error: true,
          errorMessage: message,
        },
      }));
      hadErrors = true;
    };

    const { email, password } = inputs;

    if (!email.value.trim()) {
      setErrorMessage("email", errors.emailRequired);
    }
    if (!password.value.trim()) {
      setErrorMessage("password", errors.passwordRequired);
    }

    let data = {
      email: email.value.trim(),
      password: password.value,
    };
    if (!hadErrors) {
      setLoading(true);
      onSignin(
        data,
        (res) => {
          setLoading(false);
          redirect
            ? navigate("/" + redirect)
            : res.userData?.role === userRole
            ? navigate("/student/profile")
            : navigate("/dashboard/reports");
        },
        (error) => {
          console.log(error);
          if (error?.status && error?.status === "notVerified") {
            Swal.fire({
              title: error.message,
              text: "Click below to resend verification link!",
              icon: "warning",
              showCancelButton: true,
              confirmButtonColor: "#3085d6",
              cancelButtonColor: "#d33",
              confirmButtonText: "Yes, Send Verification Link!",
            }).then((result) => {
              if (result.isConfirmed) {
                onResendVerificationLink(
                  { email: email.value },
                  (result) => {
                    Swal.fire("Done", result.message, "success");
                  },
                  (err) => {
                    Swal.fire("Failed", err?.message, "error");
                  },
                  true,
                  false
                );
              }
            });
            setLoading(false);
            return;
          }
          Swal.fire("Sign In Failed", error?.message, "error");
          setLoading(false);
        },
        false,
        false
      );
    }
  };

  const onCloseForgotPass = () => {
    setForgotPassEmail(null);
    setForgotPassError(null);
    setForgotPassSuccess(null);
    setForgotPassModal(false);
  };

  const onClickForgotPassword = () => {
    let hadErrors = false;
    const emailRegex = /^\S+@\S+\.\S+$/;

    if (!emailRegex.test(forgotPassEmail)) {
      setForgotPassError("Invaid Email Address");
      hadErrors = true;
    }

    let data = {
      email: forgotPassEmail,
    };
    if (!hadErrors) {
      setForgotPassLoading(true);
      onResetPassword(
        data,
        (result) => {
          setForgotPassEmail(null);
          setForgotPassSuccess(result.message);
          setForgotPassLoading(false);
        },
        (error) => {
          setForgotPassLoading(false);
          setForgotPassError(error.message);
        },
        false,
        false
      );
    }
  };

  const onGoogleSigninSuccess = (res) => {
    let data = {
      token: res.tokenId,
    };
    onGoogleSignin(
      data,
      (result) => {
        setLoading(false);
        redirect ? navigate("/" + redirect) : navigate("/student/quiz");
      },
      (error) => {
        Swal.fire("Sign In Failed", error?.message, "error");
        signOut();
      },
      true,
      false
    );
  };

  const onGoogleError = (e) => {
    console.log(e, "google error");
    Swal.fire("Google Authentication Failed", e?.error, "error");
  };

  const { signOut } = useGoogleLogout({
    clientId: GOOGLE_CLIENT_ID,
    onLogoutSuccess: onLogout,
    onFailure: onGoogleError,
  });

  return (
    <div>
      <div className={classes.container}>
        <p className={classes.subtitle}> STAY IN TO STAY CONNECTED</p>
        <h3 className={classes.title}> Welcome Back!</h3>

        <Box
          component="form"
          noValidate
          onSubmit={onSubmitForm.bind(this)}
          sx={{ mt: 5 }}
        >
          <TextField
            error={inputs.email.error}
            helperText={inputs.email.errorMessage}
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            value={inputs.email.value}
            onChange={onValueChangeHandler}
          />

          <TextField
            error={inputs.password.error}
            helperText={inputs.password.errorMessage}
            margin="normal"
            required
            fullWidth
            id="password"
            label="Password"
            name="password"
            type="password"
            value={inputs.password.value}
            onChange={onValueChangeHandler}
          />
          <div
            className={classes.forgotPass}
            onClick={() => setForgotPassModal(true)}
          >
            Forgot Password?
          </div>
          <LoadingButton
            type="submit"
            fullWidth
            loadingPosition="end"
            endIcon={<SignInIcon />}
            color="primary"
            loading={loading}
            loadingIndicator={"Authenticating..."}
            variant="contained"
            sx={{ mt: 2, mb: 2 }}
          >
            {!loading && "Sign In"}
          </LoadingButton>
          <Typography component="p">
            Dont have an account?{" "}
            <Link
              to={"/auth/signup"}
              style={{
                color: "blue",
              }}
            >
              Click here to sign up
            </Link>
          </Typography>
        </Box>
        <br />
        {/* <GoogleLogin
          clientId={GOOGLE_CLIENT_ID}
          onSuccess={(res) => onGoogleSigninSuccess(res)}
          onFailure={(e) => onGoogleError(e)}
          isSignedIn={true}
        /> */}

        <Dialog open={forgotPassModal} onClose={onCloseForgotPass}>
          <DialogTitle>Reset Your Password</DialogTitle>
          <DialogContent>
            <DialogContentText color={forgotPassSuccess ? "green" : ""}>
              {forgotPassSuccess
                ? forgotPassSuccess
                : "Kindly provide your email address so that we can send you the password reset verification link."}
            </DialogContentText>

            <TextField
              autoFocus
              error={forgotPassError}
              helperText={forgotPassError}
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              value={forgotPassEmail}
              onChange={(e) => {
                setForgotPassError(null);
                setForgotPassEmail(e.target.value.trim());
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={onCloseForgotPass}>Cancel</Button>
            <LoadingButton
              loadingPosition="end"
              color="primary"
              endIcon={<ResetIcon />}
              onClick={onClickForgotPassword}
              loading={forgotPassLoading}
              loadingIndicator={"Sending link..."}
              variant="contained"
              sx={{ mb: 2, mt: 2, minWidth: 200 }}
            >
              {!forgotPassLoading && "Reset Password"}
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default Signin;
