/* eslint-disable react/jsx-no-duplicate-props */
import { useContext, useEffect, useState } from "react";
import {
  NotFoundContainer,
  NotFoundContainerImage,
  NotFoundText,
} from "../../../styles";
import {
  Box,
  Grid,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  InputAdornment,
  TextField,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { FaPlus } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import _ from "lodash";
import Swal from "sweetalert2";
import TablePaginationActions from "@mui/material/TablePagination/TablePaginationActions";
import DeleteIcon from "@mui/icons-material/Delete";
import moment from "moment";
import { BatchesContext } from "../../../services/Batches/Batches.context";
import { SocketContext } from "../../../services/Socket/Socket.context";
import CreateEditBatch from "./CreateEditBatch";
import { scrollToTop } from "../../../utility/helper";
import SearchIcon from "@mui/icons-material/Search";

const Batches = ({ title }) => {
  const { onGetBatches, onDeleteBatch } = useContext(BatchesContext);
  const { socket, onFetchEvent, onEmitEvent } = useContext(SocketContext);
  const [batches, setBatches] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalBatches, setTotalBatches] = useState(0);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = title;
  }, []);

  useEffect(() => {
    console.log(page, rowsPerPage);
    getBatches();
  }, [page, rowsPerPage]);

  useEffect(() => {
    if (socket) {
      const eventHandler = (data) => {
        getBatches();
      };
      onFetchEvent("refreshBatches", eventHandler);
      return () => {
        socket?.off("refreshBatches", eventHandler);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFetchEvent, socket]);

  const getBatches = (
    query = `?page=${page + 1}&limit=${rowsPerPage}&pagination=yes`
  ) => {
    if (searchKeyword.trim()) {
      query += `&searchKeyword=${searchKeyword}`;
    }
    scrollToTop();
    onGetBatches(
      query,
      (result) => {
        setLoading(false);
        if (result && result.batches) {
          setBatches(result.batches);
          setTotalBatches(result.totalBatches);
        }
      },
      () => {
        setLoading(false);
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
      getBatches();
    } else {
      setPage(0);
    }
  };

  const onClickEditBatch = (batch) => {
    navigate("edit?id=" + batch._id);
  };

  const onClickDeleteBatch = (batch) => {
    Swal.fire({
      title: "Are you sure to delete?",
      text: `${batch.name} - ${batch.code}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        onDeleteBatch(batch._id, (result) => {
          onEmitEvent("refreshBatches");
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
    var currentBatches = batches;
    let type = sort.type === "asc" ? "desc" : "asc";
    let fields = ["name", "code"];
    if (fields.includes(fieldToSort)) {
      let sortedBatches = _.orderBy(currentBatches, fieldToSort, type);
      setSort((p) => ({
        ...p,
        type: type,
        field: fieldToSort,
      }));
      setBatches(sortedBatches);
    }
  };

  return (
    <section>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2>Batches - {totalBatches}</h2>
        <Link to={"create"}>
          <Button variant="contained" type="button" startIcon={<FaPlus />}>
            Add New Batch
          </Button>
        </Link>
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

      {batches.length === 0 && !loading && (
        <NotFoundContainer>
          <div>
            <NotFoundText>No Batches Found</NotFoundText>
            <NotFoundContainerImage
              src={require("../../../assets/no_data.png")}
              alt="..."
            />
          </div>
        </NotFoundContainer>
      )}

      {batches.length > 0 && (
        <TableContainer component={Paper} sx={{ mt: 4 }}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>S.NO</TableCell>
                <TableCell>
                  {" "}
                  <TableSortLabel
                    direction={
                      sort.type && sort.type === "desc" ? "asc" : "desc"
                    }
                    active
                    onClick={() => onChangeSorting("name")}
                  >
                    BATCH NAME
                  </TableSortLabel>
                </TableCell>
                <TableCell>BATCH CODE</TableCell>
                <TableCell>No of Students</TableCell>
                <TableCell>No of Trainers</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {batches.map((batch, index) => {
                let { name, code, students, trainers, _id, createdAt } = batch;

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
                    <TableCell>{name}</TableCell>
                    <TableCell>{code}</TableCell>
                    <TableCell>{students.length}</TableCell>
                    <TableCell>{trainers.length}</TableCell>

                    <TableCell>
                      {moment(createdAt).format("MMM DD, YYYY - hh:mm A")}
                    </TableCell>

                    <TableCell>
                      <IconButton
                        onClick={() => onClickEditBatch(batch)}
                        aria-label="edit"
                        color="info"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => onClickDeleteBatch(batch)}
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
                  rowsPerPageOptions={[10, 20, 50, 100]}
                  count={totalBatches}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  SelectProps={{
                    inputProps: {
                      "aria-label": "rows per page",
                    },
                    native: true,
                  }}
                  labelRowsPerPage="Batches Per Page"
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  ActionsComponent={TablePaginationActions}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}
    </section>
  );
};

export default Batches;
