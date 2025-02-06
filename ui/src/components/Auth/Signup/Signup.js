import { useContext, useEffect, useState } from "react";
import classes from "./Signup.module.css";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthenticationContext } from "../../../services/Authentication/Authentication.context";
import { Box, Button, Grid, TextField, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import SignInIcon from "@mui/icons-material/Login";
import Swal from "sweetalert2";

const errors = {
  emailRequired: "Invalid Email Address",
  firstNameRequired: "Please enter your first name",
  lastNameRequired: "Please enter your last name",
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
  email: {
    ...commonInputFieldProps,
  },
  firstName: {
    ...commonInputFieldProps,
  },
  lastName: {
    ...commonInputFieldProps,
  },
  password: {
    ...commonInputFieldProps,
  },
  confirmPassword: {
    ...commonInputFieldProps,
  },
};

const Signup = ({ title }) => {
  const [inputs, setInputs] = useState(defaultInputState);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  let redirect = searchParams.get("redirect");

  const { onSignup, userData } = useContext(AuthenticationContext);

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
    const emailRegex = /^\S+@\S+\.\S+$/;

    const { email, password, firstName, lastName, confirmPassword } = inputs;

    if (!firstName.value.trim()) {
      setErrorMessage("firstName", errors.firstNameRequired);
    }
    if (!lastName.value.trim()) {
      setErrorMessage("lastName", errors.lastNameRequired);
    }

    if (!emailRegex.test(email.value.trim())) {
      setErrorMessage("email", errors.emailRequired);
    }
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
      passwordInvalid = true;
    }

    if (passwordInvalid) {
      setErrorMessage("password", errors.passwordMatchRequired);
    }

    if (password.value !== confirmPassword.value) {
      setErrorMessage("confirmPassword", errors.passwordsMismatch);
    }

    let data = {
      email: email.value.trim(),
      password: password.value,
      firstName: firstName.value,
      lastName: lastName.value,
    };

    if (!hadErrors) {
      setLoading(true);
      onSignup(
        data,
        (result) => {
          Swal.fire("Signup Successfull", result.message, "success");
          setInputs(defaultInputState);
          setLoading(false);
        },
        (error) => {
          Swal.fire("Sign Up Failed", error?.message, "error");
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
        <p className={classes.subtitle}> CREATE YOUR LMS ACCOUNT</p>
        <h3 className={classes.title}> Register Now!</h3>

        <Box
          component="form"
          noValidate
          onSubmit={onSubmitForm.bind(this)}
          sx={{ mt: 3 }}
        >
          <Grid container columnSpacing={2} rowSpacing={1}>
            <Grid item md={6} xs={12}>
              <TextField
                error={inputs.firstName.error}
                helperText={inputs.firstName.errorMessage}
                margin="normal"
                required
                fullWidth
                id="firstName"
                label="First Name"
                name="firstName"
                value={inputs.firstName.value}
                onChange={onValueChangeHandler}
              />
            </Grid>
            <Grid item md={6} xs={12}>
              <TextField
                error={inputs.lastName.error}
                helperText={inputs.lastName.errorMessage}
                margin="normal"
                required
                fullWidth
                id="lastName"
                label="Last Name"
                name="lastName"
                value={inputs.lastName.value}
                onChange={onValueChangeHandler}
              />
            </Grid>
            <Grid item md={12} xs={12}>
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
            </Grid>
            <Grid item md={6} xs={12}>
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
            </Grid>
            <Grid item md={6} xs={12}>
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
            </Grid>
          </Grid>

          <LoadingButton
            type="submit"
            fullWidth
            loadingPosition="end"
            endIcon={<SignInIcon />}
            color="primary"
            loading={loading}
            loadingIndicator={"Signing up..."}
            variant="contained"
            sx={{ mt: 2, mb: 2 }}
          >
            {!loading && "Sign Up"}
          </LoadingButton>
          <Typography component="p">
            Already have an account?{" "}
            <Link
              to={"/auth/signin"}
              style={{
                color: "blue",
              }}
            >
              Click here to Sign In
            </Link>
          </Typography>
        </Box>
      </div>
    </div>
  );
};

export default Signup;
