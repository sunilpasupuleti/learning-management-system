import { LoadingButton } from "@mui/lab";
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MdPeople } from "react-icons/md";
import { BatchesContext } from "../../../services/Batches/Batches.context";
import { UsersContext } from "../../../services/users/users.context";
import { AuthenticationContext } from "../../../services/Authentication/Authentication.context";
import {
  adminRole,
  defaultRoles,
  superAdminRole,
} from "../../../utility/helper";
import _ from "lodash";

const errors = {
  emailRequired: "Invalid Email Address",
  firstNameRequired: "Please enter your first name",
  lastNameRequired: "Please enter your last name",
  passwordRequired: "Password required",
  passwordMatchRequired:
    "Your password must contain at least one uppercase letter, one lowercase letter, one number and minimum of 6 characters long",
  confirmPasswordRequired: "Please confirm your password",
  passwordsMismatch: "Passwords do not match",
  roleRequired: "Please select the role",
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
  role: {
    ...commonInputFieldProps,
  },
  batches: {
    ...commonInputFieldProps,
    value: [],
  },
  password: {
    ...commonInputFieldProps,
  },
  confirmPassword: {
    ...commonInputFieldProps,
  },
  id: {
    ...commonInputFieldProps,
  },
};

const CreateEditUser = ({ mode }) => {
  const [user, setUser] = useState(null);
  const [inputs, setInputs] = useState(defaultInputState);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { onCreateUser, onGetUser, onEditUser } = useContext(UsersContext);
  const { userData } = useContext(AuthenticationContext);
  const [roles, setRoles] = useState(defaultRoles);
  const [batches, setBatches] = useState([]);
  const { onGetBatches } = useContext(BatchesContext);

  const navigate = useNavigate();

  useEffect(() => {
    getBatches();
    if (mode) {
      let title = mode === "edit" ? "Edit User" : "Add New User";
      document.title = title;
    }
    if (mode === "edit") {
      let editId = searchParams.get("id");
      if (!editId) {
        navigate("/dashboard/users");
        return;
      }
      if (editId) {
        onGetUser(
          editId,
          (result) => {
            let userData = result.user;
            setUser(userData);
            if (userData) {
              let { firstName, lastName, email, role, _id, batches } = userData;
              let structuredBatches = [];
              if (batches.length > 0) {
                structuredBatches = batches.map((b) => ({
                  label: `${b.name} - ${b.code}`,
                  id: b._id,
                }));
              }

              setInputs((prevState) => ({
                ...prevState,
                firstName: {
                  ...commonInputFieldProps,
                  value: firstName,
                },
                batches: {
                  ...commonInputFieldProps,
                  value: structuredBatches,
                },
                lastName: {
                  ...commonInputFieldProps,
                  value: lastName,
                },
                email: {
                  ...commonInputFieldProps,
                  value: email,
                },
                role: {
                  ...commonInputFieldProps,
                  value: roles.find((r) => r.value === role),
                },
                id: {
                  value: _id,
                },
              }));
            } else {
              navigate("/dashboard/users");
            }
          },
          () => {
            navigate("/dashboard/users");
          },
          false,
          false
        );
      }
    }
  }, [mode]);

  useEffect(() => {
    if (userData) {
      let role = userData.role;
      if (role === adminRole) {
        let finalRoles = _.filter(defaultRoles, (role) =>
          ["trainer", "user"].includes(role.value)
        );
        setRoles(finalRoles);
      }
      if (role === superAdminRole) {
        let finalRoles = _.filter(
          defaultRoles,
          (role) => !["superAdmin"].includes(role.value)
        );
        setRoles(finalRoles);
      }
    }
  }, [userData]);

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

  const getBatches = (query = "?dropDown=yes") => {
    onGetBatches(
      query,
      (result) => {
        if (result.batches && result.batches.length > 0) {
          let structuredBatches = result.batches.map((b) => ({
            label: `${b.name} - ${b.code}`,
            id: b._id,
          }));
          setBatches(structuredBatches);
        }
      },
      () => {},
      false,
      false
    );
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
    const returnValue = (value) => {
      return typeof value === "string" ? value?.trim() : value;
    };

    const emailRegex = /^\S+@\S+\.\S+$/;

    let {
      firstName,
      lastName,
      email,
      role,
      password,
      confirmPassword,
      batches,
    } = inputs;
    firstName = returnValue(firstName.value);
    lastName = returnValue(lastName.value);
    email = returnValue(email.value);
    role = returnValue(role.value);
    password = returnValue(password.value);
    confirmPassword = returnValue(confirmPassword.value);
    batches = returnValue(batches.value);

    if (!firstName) {
      setErrorMessage("firstName", errors.firstNameRequired);
    }
    if (!lastName) {
      setErrorMessage("lastName", errors.lastNameRequired);
    }

    if (!emailRegex.test(email)) {
      setErrorMessage("email", errors.emailRequired);
    }

    if (!role) {
      setErrorMessage("role", errors.roleRequired);
    }

    let data = {
      email: email,
      firstName: firstName,
      lastName: lastName,
      role: role.value,
      verified: true,
    };
    let finalBatches = [];
    if (batches.length > 0 && data.role !== adminRole) {
      batches.forEach((b) => finalBatches.push(b.id));
    }
    data.batches = finalBatches;

    if (!password && mode !== "edit") {
      setErrorMessage("password", errors.passwordRequired);
    }

    if (password) {
      let passwordInvalid = false;
      var lowerCase = /[a-z]/g;
      var upperCase = /[A-Z]/g;
      var numberCase = /[0-9]/g;
      if (password.length < 6) {
        passwordInvalid = true;
      }
      if (!lowerCase.test(password)) {
        passwordInvalid = true;
      }
      if (!upperCase.test(password)) {
        passwordInvalid = true;
      }
      if (!numberCase.test(password)) {
        passwordInvalid = true;
      }

      if (passwordInvalid) {
        setErrorMessage("password", errors.passwordMatchRequired);
      }

      if (password !== confirmPassword) {
        setErrorMessage("confirmPassword", errors.passwordsMismatch);
      }
      if (!hadErrors) {
        data.password = password;
      }
    }

    if (hadErrors) {
      return;
    }

    if (mode === "edit") {
      onEditUser(inputs.id.value, data, () => {
        navigate("/dashboard/users");
      });
    } else {
      onCreateUser(data, () => {
        navigate("/dashboard/users");
      });
    }
  };

  return (
    <section>
      <Card>
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {mode === "create" ? "Add New User " : "Edit User"}
          </Typography>
          <br />
          <Box
            component="form"
            noValidate
            onSubmit={onSubmitForm.bind(this)}
            sx={{ mt: 2 }}
          >
            <Grid container spacing={2}>
              {/* for form */}

              {/*first name */}
              <Grid item md={6}>
                <TextField
                  error={inputs.firstName.error}
                  helperText={inputs.firstName.errorMessage}
                  margin="normal"
                  placeholder="Enter First Name "
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  name="firstName"
                  value={inputs.firstName.value}
                  onChange={onValueChangeHandler}
                />
              </Grid>

              {/*last name */}
              <Grid item md={6}>
                <TextField
                  error={inputs.lastName.error}
                  helperText={inputs.lastName.errorMessage}
                  margin="normal"
                  placeholder="Enter Last Name "
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  value={inputs.lastName.value}
                  onChange={onValueChangeHandler}
                />
              </Grid>

              {/* email */}
              <Grid item md={6}>
                <TextField
                  error={inputs.email.error}
                  helperText={inputs.email.errorMessage}
                  margin="normal"
                  placeholder="Enter Email Address "
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  value={inputs.email.value}
                  onChange={onValueChangeHandler}
                />
              </Grid>

              <Grid item md={6}>
                <Autocomplete
                  disablePortal
                  id="role"
                  className="mt-1"
                  options={roles}
                  fullWidth
                  // disabled={inputs.role.value?.value === superAdminRole}
                  value={inputs.role.value || null}
                  onChange={(e, newValue) => {
                    onValueChangeHandler({
                      target: {
                        name: "role",
                        value: newValue,
                      },
                    });
                  }}
                  getOptionLabel={(option) => option.label}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      error={inputs.role.error}
                      helperText={inputs.role.errorMessage}
                      label="Role "
                    />
                  )}
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

              {inputs.role.value?.value !== adminRole && (
                <Grid item md={12} xs={12}>
                  <Autocomplete
                    disablePortal
                    id="batches"
                    className="mt-1"
                    options={batches}
                    multiple
                    fullWidth
                    value={inputs.batches.value}
                    onChange={(e, newValue) => {
                      let uniqueValues = _.uniqBy(newValue, "id");
                      onValueChangeHandler({
                        target: {
                          name: "batches",
                          value: uniqueValues,
                        },
                      });
                    }}
                    getOptionLabel={(option) => option.label}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required
                        error={inputs.batches.error}
                        helperText={inputs.batches.errorMessage}
                        label="Belongs to Batches "
                      />
                    )}
                  />
                </Grid>
              )}

              {/* submit button */}

              <LoadingButton
                type="submit"
                fullWidth
                loadingPosition="end"
                endIcon={<MdPeople />}
                color="primary"
                loading={loading}
                loadingIndicator={"Adding..."}
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                {!loading && mode === "edit"
                  ? "PROCEED & UPDATE"
                  : "PROCEED & ADD"}
              </LoadingButton>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </section>
  );
};

export default CreateEditUser;
