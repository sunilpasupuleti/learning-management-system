import { useContext, useEffect, useRef, useState } from "react";
import classes from "./Reports.module.css";
import { ReportsContext } from "../../../services/Reports/Reports.context";
import {
  NotFoundContainer,
  NotFoundContainerImage,
  NotFoundText,
} from "../../../styles";
import {
  Box,
  IconButton,
  Tabs,
  Paper,
  Table,
  TableBody,
  TableCell,
  Grid,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Button,
  Tab,
  TextField,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import _ from "lodash";
import ViewIcon from "@mui/icons-material/RemoveRedEye";
import TablePaginationActions from "@mui/material/TablePagination/TablePaginationActions";
import { scrollToTop, trainerRole } from "../../../utility/helper";
import { showNotification } from "../../../shared/Notification/Notification";
import { AuthenticationContext } from "../../../services/Authentication/Authentication.context";

const Reports = ({ title }) => {
  const { userData } = useContext(AuthenticationContext);
  const { onGetReports } = useContext(ReportsContext);
  const [reports, setReports] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalReports, setTotalReports] = useState(0);

  const [loading, setLoading] = useState(true);

  const [reportsBy, setReportsBy] = useState("batches");
  const previousReportsBy = useRef("batches");

  const onChangeReportsBy = (event, newValue) => {
    setSearchKeyword("");
    setReportsBy(newValue);
    previousReportsBy.current = reportsBy;
  };

  useEffect(() => {
    document.title = title;
  }, []);

  useEffect(() => {
    getReports();
  }, [page, rowsPerPage]);

  useEffect(() => {
    if (reportsBy !== previousReportsBy.current) {
      if (page === 0) {
        getReports();
      } else {
        setPage(0);
      }
    }
  }, [reportsBy]);

  const onClickSearch = () => {
    if (page === 0) {
      getReports();
    } else {
      setPage(0);
    }
  };

  const getReports = (
    query = `?page=${page + 1}&limit=${rowsPerPage}&reportsBy=${reportsBy}`
  ) => {
    if (searchKeyword.trim()) {
      query += `&searchKeyword=${searchKeyword}`;
    }
    scrollToTop();
    onGetReports(
      query,
      (result) => {
        console.log(result);
        setLoading(false);
        setReports(result.reports);
        setTotalReports(result.totalReports);
      },
      (error) => {
        showNotification({ message: error?.message, status: "error" });
        setReports([]);
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
    var currentReports = reports;
    let type = sort.type === "asc" ? "desc" : "asc";
    let fields = ["name", "passPercentage", "failPercentage"];
    if (fields.includes(fieldToSort)) {
      let sortedReports = _.orderBy(currentReports, fieldToSort, type);
      setSort((p) => ({
        ...p,
        type: type,
        field: fieldToSort,
      }));
      setReports(sortedReports);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2>Reports - {totalReports}</h2>
      </Box>
      <Tabs value={reportsBy} onChange={onChangeReportsBy} centered>
        <Tab label="Reports By Batches" value={"batches"} />
        {userData.role !== trainerRole && (
          <Tab label="Reports By Quiz" value={"quiz"} />
        )}
      </Tabs>

      <Grid container spacing={3}>
        <Grid item md={8}>
          <TextField
            margin="normal"
            fullWidth
            id="search"
            variant="standard"
            label="Search By Keyword"
            name="search"
            value={searchKeyword}
            onChange={onChangeSearchKeyword}
          />
        </Grid>
        <Grid item md={4} mt={3}>
          <Button variant="outlined" fullWidth onClick={onClickSearch}>
            Search
          </Button>
        </Grid>
      </Grid>

      {reports.length === 0 && !loading && (
        <NotFoundContainer>
          <div>
            <NotFoundText>No Reports Found</NotFoundText>
            <NotFoundContainerImage
              src={require("../../../assets/no_data.png")}
              alt="..."
            />
          </div>
        </NotFoundContainer>
      )}

      {reports.length > 0 && (
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
                    {reportsBy === "quiz" ? "Quiz Name" : "Batch Name"}
                  </TableSortLabel>
                </TableCell>
                <TableCell>Students Attempted</TableCell>
                <TableCell>
                  {" "}
                  <TableSortLabel
                    direction={
                      sort.type && sort.type === "desc" ? "asc" : "desc"
                    }
                    active
                    onClick={() => onChangeSorting("passPercentage")}
                  >
                    Pass Percentage
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  {" "}
                  <TableSortLabel
                    direction={
                      sort.type && sort.type === "desc" ? "asc" : "desc"
                    }
                    active
                    onClick={() => onChangeSorting("failPercentage")}
                  >
                    Fail Percentage
                  </TableSortLabel>
                </TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report, index) => {
                let {
                  _id,
                  name,
                  passPercentage,
                  failPercentage,
                  totalAttempts,
                } = report;

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
                    <TableCell>{`${name}`}</TableCell>
                    <TableCell>{totalAttempts}</TableCell>
                    <TableCell sx={{ color: "green" }}>
                      {passPercentage}%
                    </TableCell>

                    <TableCell sx={{ color: "red" }}>
                      {failPercentage}%
                    </TableCell>

                    <TableCell>
                      <IconButton
                        onClick={() =>
                          navigate(`view?id=${_id}&reportsBy=${reportsBy}`)
                        }
                        aria-label="edit"
                        color="info"
                      >
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[10, 20, 50, 100]}
                  count={totalReports}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  SelectProps={{
                    inputProps: {
                      "aria-label": "rows per page",
                    },
                    native: true,
                  }}
                  labelRowsPerPage="Reports Per Page"
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  ActionsComponent={TablePaginationActions}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}
    </>
  );
};

export default Reports;
