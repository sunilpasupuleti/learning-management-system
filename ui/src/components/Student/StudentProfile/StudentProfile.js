import React, { useContext, useEffect, useState } from "react";
import { AuthenticationContext } from "../../../services/Authentication/Authentication.context";
import {
  Typography,
  Box,
  IconButton,
  Button,
  Grid,
  TextField,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import classes from "./StudentProfile.module.css";
import { UsersContext } from "../../../services/users/users.context";

const StudentProfile = ({ title }) => {
  const { onUpdateUserData, onUpdatePassword } = useContext(UsersContext);
  const { userData, onGetSelfUser } = useContext(AuthenticationContext);
  const [editNameMode, setEditNameMode] = useState(false);
  const [editPasswordMode, setEditPasswordMode] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState({
    password: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({
    oldPasswordErr: "",
    newPasswordErr: "",
    confirmPasswordErr: "",
  });
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (userData) {
      setFirstName(userData.firstName || "");
      setLastName(userData.lastName || "");
    }
  }, [userData]);

  useEffect(() => {
    document.title = title;
  }, []);

  const handleEditNameClick = () => {
    setEditNameMode(true);
  };

  const handleCancelNameClick = () => {
    setEditNameMode(false);
    setFirstName(userData?.firstName || "");
    setLastName(userData?.lastName || "");
    setNameError("");
  };

  const handleConfirmNameClick = () => {
    if (firstName.trim() === "" || lastName.trim() === "") {
      setNameError("First name and last name cannot be empty");
    } else {
      const data = {
        firstName,
        lastName,
        userId: userData._id,
        role: userData.role,
      };
      onUpdateUserData(
        data,
        (result) => {
          if (result.status === "success") {
            setNameError("");
            setEditNameMode(false);
          }
        },
        (e) => console.log(e),
      );
    }
  };

  const handleChangePassClick = () => {
    setEditPasswordMode(true);
  };

  const handleCancelPassClick = () => {
    setEditPasswordMode(false);
    setOldPassword("");
    setNewPassword({ password: "", confirmPassword: "" });
    setEmptyErrors();
  };

  const setEmptyErrors = () => {
    setPasswordErrors({
      newPasswordErr: "",
      oldPasswordErr: "",
      confirmPasswordErr: "",
    });
  };

  const handleConfirmPassClick = () => {
    if (newPassword.password.trim() !== newPassword.confirmPassword.trim()) {
      setPasswordErrors((prevErr) => ({
        ...prevErr,
        confirmPasswordErr: "Passwords do not match",
        newPasswordErr: "Passwords do not match",
      }));
      return;
    } else {
      setEmptyErrors();
    }
    if (
      passwordErrors.oldPasswordErr.trim() ||
      passwordErrors.newPasswordErr.trim() ||
      passwordErrors.confirmPasswordErr.trim()
    ) {
      return;
    }
    const data = {
      oldPassword,
      newPassword: newPassword.password,
      userId: userData._id,
    };
    onUpdatePassword(
      data,
      (result) => {
        if (result.status === "success") {
          setEditPasswordMode(false);
        }
      },
      (e) => console.log(e),
    );
  };

  return (
    <>
      <Box
        mt={4}
        p={1.5}
        border={1}
        borderRadius={3}
        boxShadow={3}
        position="relative"
        className={editNameMode && classes.fieldPad}>
        {editNameMode ? (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  fullWidth
                  error={nameError !== ""}
                  helperText={nameError}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  fullWidth
                  error={nameError !== ""}
                  helperText={nameError}
                />
              </Grid>
            </Grid>
            <Box mt={2}>
              <Button
                variant="contained"
                onClick={handleCancelNameClick}
                style={{ marginRight: "10px" }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleConfirmNameClick}>
                Confirm
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <IconButton
              aria-label="edit"
              onClick={handleEditNameClick}
              style={{ position: "absolute", top: "12px", right: "5px" }}>
              <EditIcon />
            </IconButton>
            <Typography variant="h6" component="h2" gutterBottom>
              <Typography variant="body1" component="span">
                Name:
              </Typography>{" "}
              <Typography variant="body1" component="span" fontWeight="bold">
                {firstName} {lastName}
              </Typography>
            </Typography>
          </>
        )}
      </Box>

      <Box mt={2} p={1.5} border={1} borderRadius={3} boxShadow={3}>
        <Typography variant="h6" component="h2" gutterBottom>
          <Typography variant="body1" component="span">
            Email:
          </Typography>{" "}
          <Typography variant="body1" component="span" fontWeight="bold">
            {userData?.email}
          </Typography>
        </Typography>
      </Box>

      <Box
        mt={4}
        p={1.5}
        border={1}
        borderRadius={3}
        boxShadow={3}
        position="relative"
        className={editPasswordMode && classes.fieldPad}>
        {editPasswordMode ? (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Old Password"
                  value={oldPassword}
                  type="password"
                  onChange={(e) => {
                    setOldPassword(e.target.value);
                    setPasswordErrors((prevErr) => ({
                      ...prevErr,
                      oldPasswordErr: e.target.value.trim()
                        ? ""
                        : "Old Password cannot be empty",
                    }));
                  }}
                  error={passwordErrors.oldPasswordErr !== ""}
                  helperText={passwordErrors.oldPasswordErr}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="New Password"
                  name="password"
                  type="password"
                  value={newPassword.password}
                  onChange={(e) => {
                    setNewPassword((p) => ({
                      ...p,
                      [e.target.name]: e.target.value,
                    }));
                    setPasswordErrors((prevErr) => ({
                      ...prevErr,
                      newPasswordErr: e.target.value
                        ? ""
                        : "Password cannot be empty",
                    }));
                  }}
                  error={passwordErrors.newPasswordErr !== ""}
                  helperText={passwordErrors.newPasswordErr}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={newPassword.confirmPassword}
                  onChange={(e) => {
                    setNewPassword((p) => ({
                      ...p,
                      [e.target.name]: e.target.value,
                    }));
                    setPasswordErrors((prevErr) => ({
                      ...prevErr,
                      confirmPasswordErr: e.target.value
                        ? ""
                        : "Password cannot be empty",
                    }));
                  }}
                  error={passwordErrors.confirmPasswordErr !== ""}
                  helperText={passwordErrors.confirmPasswordErr}
                  fullWidth

                />
              </Grid>
            </Grid>
            <Box mt={2}>
              <Button
                variant="contained"
                onClick={handleCancelPassClick}
                style={{ marginRight: "10px" }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleConfirmPassClick}>
                Confirm
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <IconButton
              aria-label="edit"
              onClick={handleChangePassClick}
              style={{
                position: "absolute",
                top: "12px",
                right: "5px",
              }}>
              <Typography
                style={{
                  color: "#007bff",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
                variant="body1">
                Change
              </Typography>
            </IconButton>
            <Typography variant="h6" component="h2" gutterBottom>
              <Typography variant="body1" component="span">
                Password:
              </Typography>{" "}
              <Typography variant="body1" component="span" fontWeight="bold">
                **********
              </Typography>
            </Typography>
          </>
        )}
      </Box>

      <Box
        mt={2}
        p={1.5}
        border={1}
        borderRadius={3}
        boxShadow={3}
        className={classes.batchesContainer}>
        <Typography variant="body1" component="span" gutterBottom>
          Batches:
        </Typography>
        <Box style={{ display: "flex", flexWrap: "wrap" }}>
          {userData?.batchNames?.map((batchName, i) => (
            <Box
              key={i}
              p={1}
              m={1}
              border={1}
              borderRadius={4}
              boxShadow={3}
              style={{ minWidth: 120 }}>
              <Typography variant="body2" component="span">
                {batchName}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </>
  );
};

export default StudentProfile;
