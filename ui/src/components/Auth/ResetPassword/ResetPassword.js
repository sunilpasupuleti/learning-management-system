import { useContext, useEffect, useState } from "react";
import classes from "./ResetPassword.module.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AuthenticationContext } from "../../../services/Authentication/Authentication.context";
import { Box, Grid, TextField, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import SignInIcon from "@mui/icons-material/Login";
import Swal from "sweetalert2";

const errors = {
  passwordRequired: "Password required",
  passwordMatchRequired:
    "Your password must contain at least one uppercase letter, one lowercase letter, one number and minimum of 6 characters long",
  confirmPasswordRequired: "Please confirm your password",
  passwordsMismatch: "Passwords do not match",
};

const commonInputFieldProps = {
  value: "",
  focused: false,
  error: false,
  errorMessage: "",
};

const defaultInputState = {
  password: {
    ...commonInputFieldProps,
  },
  confirmPassword: {
    ...commonInputFieldProps,
  },
};

const ResetPassword = ({ title }) => {
  const [inputs, setInputs] = useState(defaultInputState);
  const navigate = useNavigate();
  const { resetPasswordToken } = useParams();
  const [loading, setLoading] = useState(false);

  const { onVerifyResetPassword, userData } = useContext(AuthenticationContext);

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

    const { password, confirmPassword } = inputs;

    if (!password.value.trim()) {
      setErrorMessage("password", errors.passwordRequired);
    }

    let passwordInvalid = false;
    var lowerCase = /[a-z]/g;
    var upperCase = /[A-Z]/g;
    var numberCase = /[0-9]/g;

    if (password.value.length < 6) {
      passwordInvalid = true;
    }
    if (!lowerCase.test(password.value)) {
      passwordInvalid = true;
    }
    if (!upperCase.test(password.value)) {
      passwordInvalid = true;
    }
    if (!numberCase.test(password.value)) {
      console.log("hey");
      passwordInvalid = true;
    }

    if (passwordInvalid) {
      setErrorMessage("password", errors.passwordMatchRequired);
    }

    if (password.value !== confirmPassword.value) {
      setErrorMessage("confirmPassword", errors.passwordsMismatch);
    }

    let data = {
      password: password.value,
    };

    if (!hadErrors) {
      setLoading(true);
      onVerifyResetPassword(
        resetPasswordToken,
        data,
        (result) => {
          Swal.fire("Done", result.message, "success");
          setInputs(defaultInputState);
          setLoading(false);
        },
        (error) => {
          Swal.fire("Failed", error?.message, "error");
          setLoading(false);
        },
        false,
        false
      );
    }
  };

  return (
    <div>
      <div className={classes.container}>
        <p className={classes.subtitle}> RESET PASSWORD</p>
        <h3 className={classes.title}> Set your new Password!</h3>

        <Box
          component="form"
          noValidate
          onSubmit={onSubmitForm.bind(this)}
          sx={{ mt: 3 }}
        >
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

          <TextField
            error={inputs.confirmPassword.error}
            helperText={inputs.confirmPassword.errorMessage}
            margin="normal"
            required
            fullWidth
            id="confirmPassword"
            label="Confirm Password"
            name="confirmPassword"
            type="text"
            value={inputs.confirmPassword.value}
            onChange={onValueChangeHandler}
          />

          <LoadingButton
            type="submit"
            fullWidth
            loadingPosition="end"
            endIcon={<SignInIcon />}
            color="primary"
            loading={loading}
            loadingIndicator={"Please wait..."}
            variant="contained"
            sx={{ mt: 2, mb: 2 }}
          >
            {!loading && "Reset Password"}
          </LoadingButton>
          <Typography component="p">
            <Link
              to={"/auth/signin"}
              style={{
                color: "blue",
              }}
            >
              Go Back to Sign In
            </Link>
          </Typography>
        </Box>
      </div>
    </div>
  );
};

export default ResetPassword;
