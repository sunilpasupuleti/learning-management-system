/* eslint-disable react/jsx-no-duplicate-props */
import { useContext, useEffect, useState } from "react";
import {
  NotFoundContainer,
  NotFoundContainerImage,
  NotFoundText,
} from "../../../styles";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Input,
  Table,
  Grid,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  Modal,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  InputAdornment,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { FaFileCsv, FaPlus } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import _ from "lodash";
import Swal from "sweetalert2";
import TablePaginationActions from "@mui/material/TablePagination/TablePaginationActions";
import DeleteIcon from "@mui/icons-material/Delete";
import moment from "moment";
import { SocketContext } from "../../../services/Socket/Socket.context";
import { UsersContext } from "../../../services/users/users.context";
import CreateEditUser from "./CreateEditUser";
import { defaultRoles, scrollToTop } from "../../../utility/helper";
import { HelperContext } from "../../../services/Helper/Helper.context";
import SearchIcon from "@mui/icons-material/Search";
import { showNotification } from "../../../shared/Notification/Notification";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 500,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

const Users = ({ title }) => {
  const { onGetUsers, onDeleteUser, onCreateUsersFromCsv } =
    useContext(UsersContext);
  const { socket, onFetchEvent, onEmitEvent } = useContext(SocketContext);
  const [users, setUsers] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalUsers, setTotalUsers] = useState(0);
  const [csvFile, setCsvFile] = useState(null);

  const [loading, setLoading] = useState(true);

  const [openUploadModal, setOpenUploadModal] = useState(false);
  const handleOpen = () => {
    setOpenUploadModal(true);
  };
  const handleClose = () => {
    setOpenUploadModal(false);
    setCsvFile(null);
  };

  useEffect(() => {
    document.title = title;
  }, []);

  useEffect(() => {
    getUsers();
  }, [page, rowsPerPage]);

  useEffect(() => {
    if (socket) {
      const eventHandler = (data) => {
        getUsers();
      };
      onFetchEvent("refreshUsers", eventHandler);
      return () => {
        socket?.off("refreshUsers", eventHandler);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFetchEvent, socket]);

  const getUsers = (query = `?page=${page + 1}&limit=${rowsPerPage}`) => {
    if (searchKeyword.trim()) {
      query += `&searchKeyword=${searchKeyword}`;
    }
    scrollToTop();
    onGetUsers(
      query,
      (result) => {
        setLoading(false);
        if (result && result.users) {
          setUsers(result.users);
          setTotalUsers(result.totalUsers);
        }
      },
      true,
      false
    );
  };

  const onChangeSearchKeyword = (e) => {
    let value = e.target.value;
    setSearchKeyword(value);
  };

  const onClickSearch = () => {
    if (page === 0) {
      getUsers();
    } else {
      setPage(0);
    }
  };

  const onClickEditUser = (user) => {
    navigate("edit?id=" + user._id);
  };

  const onClickDeleteUser = (user) => {
    Swal.fire({
      title: "Are you sure to delete?",
      text: `${user.firstName} - ${user.lastName}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        onDeleteUser(user._id, (result) => {
          onEmitEvent("refreshUsers");
        });
      }
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const [sort, setSort] = useState({
    type: "desc",
    field: null,
  });

  const onChangeSorting = (fieldToSort) => {
    var currentUsers = users;
    let type = sort.type === "asc" ? "desc" : "asc";
    let fields = ["email"];
    if (fields.includes(fieldToSort)) {
      let sortedUsers = _.orderBy(currentUsers, fieldToSort, type);
      setSort((p) => ({
        ...p,
        type: type,
        field: fieldToSort,
      }));
      setUsers(sortedUsers);
    }
  };

  const getBatchNames = (user) => {
    if (user?.batches?.length > 0) {
      let batches = user.batches.map((b) => {
        return `${b.name} - ${b.code}`;
      });
      return batches.join(", ");
    } else {
      return " ------ ";
    }
  };

  const onHandleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setCsvFile(selectedFile);
    console.log(selectedFile);
  };

  const onUploadCsv = () => {
    const showMessage = (message) => {
      showNotification({ message: message, status: "error" });
    };
    if (!csvFile) {
      showMessage("Please select CSV File");
      return;
    }
    if (csvFile.type !== "text/csv") {
      showMessage("Only CSV Files Allowed");
      return;
    }
    let formData = new FormData();
    formData.append("csv", csvFile);
    onCreateUsersFromCsv(
      formData,
      (result) => {
        handleClose();
        onEmitEvent("refreshUsers", {});
      },
      () => {}
    );
  };

  return (
    <section>
      <>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2>Users - {totalUsers}</h2>
          <div>
            <Button
              variant="outlined"
              color="secondary"
              type="button"
              startIcon={<FaFileCsv />}
              onClick={handleOpen}
              className="mr-1"
            >
              Upload from CSV
            </Button>

            <Link to={"create"}>
              <Button variant="contained" type="button" startIcon={<FaPlus />}>
                Add User
              </Button>
            </Link>
          </div>
        </Box>

        <TextField
          margin="normal"
          fullWidth
          id="search"
          variant="standard"
          label="Search By Keyword"
          name="search"
          value={searchKeyword}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => onClickSearch()}
                  edge="end"
                >
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          onChange={(e) => onChangeSearchKeyword(e)}
        />

        {users.length === 0 && !loading && (
          <NotFoundContainer>
            <div>
              <NotFoundText>No Users Found</NotFoundText>
              <NotFoundContainerImage
                src={require("../../../assets/no_data.png")}
                alt="..."
              />
            </div>
          </NotFoundContainer>
        )}

        {users.length > 0 && (
          <TableContainer component={Paper} sx={{ mt: 4 }}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>S.NO</TableCell>
                  <TableCell>Name </TableCell>
                  <TableCell>
                    {" "}
                    <TableSortLabel
                      direction={
                        sort.type && sort.type === "desc" ? "asc" : "desc"
                      }
                      active
                      onClick={() => onChangeSorting("email")}
                    >
                      Email
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Role </TableCell>
                  <TableCell>Batches</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users
                  // rowsPerPage > 0
                  // ? users.slice(
                  //     page * rowsPerPage,
                  //     page * rowsPerPage + rowsPerPage
                  //   )
                  // :
                  .map((user, index) => {
                    let { firstName, lastName, email, _id, role, createdAt } =
                      user;
                    role = defaultRoles.find((r) => r.value === role);

                    return (
                      <TableRow
                        key={_id}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell component="th" scope="row">
                          {index + 1 + page * rowsPerPage}
                        </TableCell>
                        <TableCell>{`${firstName} ${lastName}`}</TableCell>
                        <TableCell>{email}</TableCell>
                        <TableCell>
                          <strong>{role.label}</strong>
                        </TableCell>
                        <TableCell>{getBatchNames(user)}</TableCell>

                        <TableCell>
                          {moment(createdAt).format("MMM DD, YYYY - hh:mm A")}
                        </TableCell>

                        <TableCell>
                          <IconButton
                            onClick={() => onClickEditUser(user)}
                            aria-label="edit"
                            color="info"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => onClickDeleteUser(user)}
                            aria-label="delete"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>{" "}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TablePagination
                    rowsPerPageOptions={[20, 50, 100, 200]}
                    count={totalUsers}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    SelectProps={{
                      inputProps: {
                        "aria-label": "rows per page",
                      },
                      native: true,
                    }}
                    labelRowsPerPage="Users Per Page"
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    ActionsComponent={TablePaginationActions}
                  />
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        )}

        <Modal
          open={openUploadModal}
          onClose={handleClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={modalStyle}>
            <Input
              fullWidth
              onChange={onHandleFileChange}
              inputProps={{
                accept: ".csv",
                placeholder: "Upload Csv File",
              }}
              type="file"
            />
            <br />
            <Button
              fullWidth
              sx={{ mt: 2 }}
              variant="contained"
              color="primary"
              component="span"
              onClick={onUploadCsv}
            >
              Upload & Create Users
            </Button>
          </Box>
        </Modal>
      </>
    </section>
  );
};

export default Users;
