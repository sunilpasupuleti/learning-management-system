import { LoadingButton } from "@mui/lab";
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Button,
  Paper,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  Tab,
  InputAdornment,
  IconButton,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BatchesContext } from "../../../services/Batches/Batches.context";
import { UsersContext } from "../../../services/users/users.context";
import { FaUsersViewfinder } from "react-icons/fa6";
import _ from "lodash";
import TablePaginationActions from "@mui/material/TablePagination/TablePaginationActions";
import SearchIcon from "@mui/icons-material/Search";
import { showLoader } from "../../../shared/Loader/Loader";
import { useDispatch } from "react-redux";
const errors = {
  nameRequired: "Batch name required",
  codeRequired: "Batch code required",
};

const commonInputFieldProps = {
  value: "",
  focused: false,
  error: false,
  errorMessage: "",
};

const defaultInputState = {
  name: {
    ...commonInputFieldProps,
  },
  code: {
    ...commonInputFieldProps,
  },

  id: {
    ...commonInputFieldProps,
  },
};

const CreateEditBatch = ({ mode }) => {
  const [batch, setBatch] = useState(null);
  const [inputs, setInputs] = useState(defaultInputState);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();

  const [students, setStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [studentsTab, setStudentsTab] = useState("unselected");

  const [trainersTab, setTrainersTab] = useState("unselected");
  const [trainers, setTrainers] = useState([]);
  const [totalTrainers, setTotalTrainers] = useState(0);

  const {
    onCreateBatch,
    onGetBatch,
    onEditBatch,
    onGetBatchStudentsAndTrainers,
    onUpdateBatchStudentAndTrainers,
  } = useContext(BatchesContext);
  const [searchKeyword, setSearchKeyword] = useState({
    type: "",
    student: "",
    trainer: "",
  });

  const [studentPage, setStudentPage] = useState(0);
  const [studentRowsPerPage, setStudentRowsPerPage] = useState(10);
  const [trainerPage, setTrainerPage] = useState(0);
  const [trainerRowsPerPage, setTrainerRowsPerPage] = useState(10);

  const navigate = useNavigate();

  useEffect(() => {
    if (mode) {
      let title = mode === "edit" ? "Edit Batch" : "Add New Batch";
      document.title = title;
    }
    if (mode === "edit") {
      let editId = searchParams.get("id");

      if (!editId) {
        navigate("/dashboard/batches");
        return;
      }
      setInputs((p) => ({
        ...p,
        id: {
          ...p.id,
          value: editId,
        },
      }));
    }
  }, [mode]);

  useEffect(() => {
    if (inputs.id?.value) {
      getBatch();
    }
  }, [inputs.id]);

  const getBatch = () => {
    console.log("gettinf batch");
    onGetBatch(
      inputs.id.value,
      (result) => {
        let batchData = result.batch;
        setBatch(batchData);
        if (batchData) {
          let { name, code } = batchData;
          setInputs((prevState) => ({
            ...prevState,
            name: {
              ...commonInputFieldProps,
              value: name,
            },
            code: {
              ...commonInputFieldProps,
              value: code,
            },
          }));
        } else {
          navigate("/dashboard/batches");
        }
      },
      () => {
        navigate("/dashboard/batches");
      },
      false,
      false
    );
  };

  const onChangeStudentsTab = (event, newValue) => {
    setSearchKeyword((p) => ({
      ...p,
      student: "",
    }));
    setStudentsTab(newValue);
    setStudents([]);
    // previousReportsBy.current = reportsBy;
  };

  const onChangeTrainersTab = (event, newValue) => {
    setSearchKeyword((p) => ({
      ...p,
      trainer: "",
    }));
    setTrainersTab(newValue);
    setTrainers([]);
    // previousReportsBy.current = reportsBy;
  };

  useEffect(() => {
    if (inputs.id.value && studentsTab) {
      getStudents(studentPage, studentRowsPerPage, "", studentsTab);
    }
  }, [studentPage, studentRowsPerPage, inputs.id, studentsTab]);

  useEffect(() => {
    if (inputs.id.value && trainersTab) {
      getTrainers(trainerPage, trainerRowsPerPage, "", trainersTab);
    }
  }, [trainerPage, trainerRowsPerPage, inputs.id, trainersTab]);

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
    const returnValue = (value) => {
      return typeof value === "string" ? value?.trim() : value;
    };
    let { name, code } = inputs;
    name = returnValue(name.value);
    code = returnValue(code.value);

    if (!name) {
      setErrorMessage("name", errors.nameRequired);
    }
    if (!code) {
      setErrorMessage("code", errors.codeRequired);
    }

    if (hadErrors) {
      return;
    }
    let data = {
      name: name,
      code: code,
    };
    if (mode === "edit") {
      onEditBatch(inputs.id.value, data, () => {
        getBatch();
      });
    } else {
      onCreateBatch(data, (result) => {
        let batchId = result.batch;
        navigate("/dashboard/batches/edit?id=" + batchId);
      });
    }
  };

  const getStudents = (page, rowsPerPage, searchKeyword, type) => {
    let query = `?page=${page + 1}&limit=${rowsPerPage}&role=student&batchId=${
      inputs.id.value
    }&type=${type}`;
    if (searchKeyword && searchKeyword.trim()) {
      query += `&searchKeyword=${searchKeyword}`;
    }
    onGetBatchStudentsAndTrainers(
      query,
      (result) => {
        let { users, totalUsers } = result;
        if (users) {
          setStudents(users);
          setTotalStudents(totalUsers);
        }
      },
      () => {},
      true,
      false
    );
  };

  const getTrainers = (page, rowsPerPage, searchKeyword, type) => {
    let query = `?page=${page + 1}&limit=${rowsPerPage}&role=trainer&batchId=${
      inputs.id.value
    }&type=${type}`;
    if (searchKeyword && searchKeyword.trim()) {
      query += `&searchKeyword=${searchKeyword}`;
    }
    onGetBatchStudentsAndTrainers(
      query,
      (result) => {
        let { users, totalUsers } = result;
        if (users) {
          setTrainers(users);
          setTotalTrainers(totalUsers);
        }
      },
      () => {},
      false,
      false
    );
  };

  const onClickCheckbox = (role, userId) => {
    setSearchKeyword((p) => ({
      ...p,
      [role]: "",
    }));
    let data = {
      userId: userId,
      role: role,
    };
    showLoader(dispatch);
    onUpdateBatchStudentAndTrainers(
      inputs.id.value,
      data,
      (result) => {
        let { students, trainers } = result?.batch;
        if (role === "student" && students) {
          studentPage === 0
            ? getStudents(studentPage, studentRowsPerPage, null, studentsTab)
            : setStudentPage(0);
        }
        if (role === "trainer" && trainers) {
          trainerPage === 0
            ? getTrainers(trainerPage, trainerRowsPerPage, null, trainersTab)
            : setTrainerPage(0);
        }
      },
      () => {},
      true,
      true
    );
  };

  const onChangeSearchKeyword = (type, e) => {
    let value = e.target.value;
    let obj = {
      type: type,
      student: type === "student" ? value : "",
      trainer: type === "trainer" ? value : "",
    };
    setSearchKeyword(obj);
  };

  const onClickSearch = (type) => {
    if (studentPage === 0 && type === "student") {
      getStudents(
        studentPage,
        studentRowsPerPage,
        searchKeyword.student,
        studentsTab
      );
    } else {
      setStudentPage(0);
    }

    if (trainerPage === 0 && type === "trainer") {
      getTrainers(
        trainerPage,
        trainerRowsPerPage,
        searchKeyword.trainer,
        trainersTab
      );
    } else {
      setTrainerPage(0);
    }
  };

  const handleChangePage = (event, type, newPage) => {
    if (type === "student") {
      setStudentPage(newPage);
    } else {
      setTrainerPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event, type) => {
    let value = event.target?.value;
    if (type === "student") {
      setStudentRowsPerPage(parseInt(value));
      setStudentPage(0);
    } else {
      setTrainerRowsPerPage(parseInt(value));
      setTrainerPage(0);
    }
  };

  return (
    <section>
      <Card>
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {mode === "create" ? "Add New Batch " : "Edit Batch"}
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

              {/* name */}
              <Grid item md={6}>
                <TextField
                  error={inputs.name.error}
                  helperText={inputs.name.errorMessage}
                  margin="normal"
                  placeholder="Enter Batch Name "
                  required
                  fullWidth
                  id="name"
                  label="Batch Name"
                  name="name"
                  value={inputs.name.value}
                  onChange={onValueChangeHandler}
                />
              </Grid>

              {/* code */}
              <Grid item md={6}>
                <TextField
                  required
                  inputProps={{
                    style: { textTransform: "uppercase" },
                  }}
                  error={inputs.code.error}
                  helperText={inputs.code.errorMessage}
                  margin="normal"
                  fullWidth
                  id="code"
                  label="Batch Code"
                  placeholder="Enter Batch Code"
                  name="code"
                  value={inputs.code.value}
                  onChange={onValueChangeHandler}
                />
              </Grid>
              {/* submit button */}

              <LoadingButton
                type="button"
                fullWidth
                loadingPosition="end"
                endIcon={<FaUsersViewfinder />}
                color="primary"
                onClick={onSubmitForm}
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

          {/* Students */}

          {inputs?.id?.value && (
            <Box mt={3}>
              <Tabs value={studentsTab} onChange={onChangeStudentsTab} centered>
                <Tab label="Add Students" value={"unselected"} />
                <Tab label={`Selected Students`} value={"selected"} />
              </Tabs>
              <Box mt={3}>
                <h4>
                  {studentsTab === "unselected" ? "Available" : "Selected"}{" "}
                  Students - {totalStudents}
                </h4>
                <TextField
                  margin="normal"
                  fullWidth
                  id="search"
                  variant="standard"
                  label="Search By Keyword"
                  name="search"
                  value={searchKeyword.student}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => onClickSearch("student")}
                          edge="end"
                        >
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  onChange={(e) => onChangeSearchKeyword("student", e)}
                />

                {students && students.length > 0 && (
                  <Box mt={2}>
                    <TableContainer component={Paper} sx={{ mt: 4 }}>
                      <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead>
                          <TableRow>
                            <TableCell></TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {students.map((student, index) => {
                            let { firstName, lastName, email, _id } = student;
                            let name = `${firstName} ${lastName}`;
                            return (
                              <TableRow
                                key={_id}
                                sx={{
                                  "&:last-child td, &:last-child th": {
                                    border: 0,
                                  },
                                }}
                              >
                                <TableCell>
                                  <FormGroup>
                                    <FormControlLabel
                                      checked={
                                        studentsTab === "selected"
                                          ? true
                                          : false
                                      }
                                      onChange={(e) =>
                                        onClickCheckbox("student", _id)
                                      }
                                      control={<Checkbox />}
                                    />
                                  </FormGroup>
                                </TableCell>

                                <TableCell>{name}</TableCell>
                                <TableCell>{email}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                        <TableFooter>
                          <TableRow>
                            <TablePagination
                              rowsPerPageOptions={[10, 20, 50, 300]}
                              count={totalStudents}
                              rowsPerPage={studentRowsPerPage}
                              page={studentPage}
                              SelectProps={{
                                inputProps: {
                                  "aria-label": "rows per page",
                                },
                                native: true,
                              }}
                              onPageChange={(e, newPage) =>
                                handleChangePage(e, "student", newPage)
                              }
                              labelRowsPerPage="Total Students"
                              onRowsPerPageChange={(e, newPage) =>
                                handleChangeRowsPerPage(e, "student", newPage)
                              }
                              ActionsComponent={TablePaginationActions}
                            />
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
                {(!students || students.length === 0) && (
                  <Box mt={3}>
                    <h1 style={{ textAlign: "center" }}>No Students Found</h1>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* Trainers */}
          {inputs?.id?.value && (
            <Box mt={5}>
              <Tabs value={trainersTab} onChange={onChangeTrainersTab} centered>
                <Tab label="Add Trainers" value={"unselected"} />
                <Tab label={`Selected Trainers`} value={"selected"} />
              </Tabs>
              <Box mt={3}>
                <h4>
                  {trainersTab === "unselected" ? "Available" : "Selected"}{" "}
                  Trainers - {totalTrainers}
                </h4>
                <TextField
                  margin="normal"
                  fullWidth
                  id="search"
                  variant="standard"
                  label="Search By Keyword"
                  name="search"
                  value={searchKeyword.student}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => onClickSearch("trainer")}
                          edge="end"
                        >
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  onChange={(e) => onChangeSearchKeyword("trainer", e)}
                />

                {trainers && trainers.length > 0 && (
                  <Box mt={2}>
                    <TableContainer component={Paper} sx={{ mt: 4 }}>
                      <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead>
                          <TableRow>
                            <TableCell></TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {trainers.map((trainer, index) => {
                            let { firstName, lastName, email, _id } = trainer;
                            let name = `${firstName} ${lastName}`;
                            return (
                              <TableRow
                                key={_id}
                                sx={{
                                  "&:last-child td, &:last-child th": {
                                    border: 0,
                                  },
                                }}
                              >
                                <TableCell>
                                  <FormGroup>
                                    <FormControlLabel
                                      checked={
                                        trainersTab === "selected"
                                          ? true
                                          : false
                                      }
                                      onChange={(e) =>
                                        onClickCheckbox("trainer", _id)
                                      }
                                      control={<Checkbox />}
                                    />
                                  </FormGroup>
                                </TableCell>

                                <TableCell>{name}</TableCell>
                                <TableCell>{email}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                        <TableFooter>
                          <TableRow>
                            <TablePagination
                              rowsPerPageOptions={[10, 20, 50, 300]}
                              count={totalTrainers}
                              rowsPerPage={trainerRowsPerPage}
                              page={trainerPage}
                              SelectProps={{
                                inputProps: {
                                  "aria-label": "rows per page",
                                },
                                native: true,
                              }}
                              labelRowsPerPage="Total Trainers"
                              onPageChange={(e, newPage) =>
                                handleChangePage(e, "trainer", newPage)
                              }
                              onRowsPerPageChange={(e, newPage) =>
                                handleChangeRowsPerPage(e, "trainer", newPage)
                              }
                              ActionsComponent={TablePaginationActions}
                            />
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
                {(!trainers || trainers.length === 0) && (
                  <Box mt={3}>
                    <h1 style={{ textAlign: "center" }}>No Trainers Found</h1>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </section>
  );
};

export default CreateEditBatch;
