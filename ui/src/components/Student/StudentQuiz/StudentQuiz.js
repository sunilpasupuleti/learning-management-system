import { useContext, useEffect, useState } from "react";
import { QuizContext } from "../../../services/Quiz/Quiz.context";
import {
  NotFoundContainer,
  NotFoundContainerImage,
  NotFoundText,
} from "../../../styles";
import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  InputAdornment,
  Grid,
  TablePagination,
  TableRow,
  TextField,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import moment from "moment";
import { MdOutlineNotStarted } from "react-icons/md";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { formatTime } from "../../../utility/helper";
import TablePaginationActions from "@mui/material/TablePagination/TablePaginationActions";

const StudentQuiz = ({ title }) => {
  const { onGetQuizes } = useContext(QuizContext);
  const [quizes, setQuizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalQuizes, setTotalQuizes] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState("");

  useEffect(() => {
    document.title = title;
  }, []);

  useEffect(() => {
    getQuizes();
  }, [page, rowsPerPage]);

  const onChangeSearchKeyword = (e) => {
    let value = e.target.value;
    setSearchKeyword(value);
  };

  const onClickSearch = () => {
    if (page === 0) {
      getQuizes();
    } else {
      setPage(0);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getQuizes = (query = `?page=${page + 1}&limit=${rowsPerPage}`) => {
    if (searchKeyword.trim()) {
      query += `&searchKeyword=${searchKeyword}`;
    }

    onGetQuizes(
      query,
      (result) => {
        setLoading(false);
        console.log(result);
        setQuizes(result.quizes);
      },
      true,
      false
    );
  };

  const AvailableFromCountdownTimer = ({ availableFrom }) => {
    const calculateTimeRemaining = () => {
      const now = moment();
      const startDate = moment(availableFrom);
      const duration = moment.duration(startDate.diff(now));
      const secondsRemaining = Math.max(0, duration.asSeconds());
      return Math.floor(secondsRemaining);
    };

    const [timeRemaining, setTimeRemaining] = useState(
      calculateTimeRemaining()
    );
    useEffect(() => {
      const timer = setInterval(() => {
        setTimeRemaining(calculateTimeRemaining());
      }, 1000);

      return () => clearInterval(timer);
    }, [availableFrom]);

    const formatTime = (time) => moment.utc(time * 1000).format("hh:mm:ss");
    const hasStarted = timeRemaining === 0;

    return (
      <p
        style={{
          color: hasStarted ? "#027FFE" : "#FF0000",
        }}
      >
        {hasStarted
          ? `${moment(availableFrom).format("MMM DD, YYYY - hh:mm A")}`
          : `Starts In ${formatTime(timeRemaining)}`}
      </p>
    );
  };

  const onStartQuiz = (quiz) => {
    let { availableFrom, name } = quiz;
    if (moment().isBefore(availableFrom)) {
      Swal.fire({
        title: `Will be available ${moment(availableFrom).fromNow()}`,
        text: `${name} not yet started! Come back later`,
        icon: "info",
      });
      return;
    }

    navigate(`start?id=${quiz._id}`);
  };

  return (
    <>
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

      {quizes.length === 0 && !loading && (
        <NotFoundContainer>
          <div>
            <NotFoundText>
              No Quizes Available Right Now! <br /> Come Back Later
            </NotFoundText>
            <NotFoundContainerImage
              src={require("../../../assets/no_data.png")}
              alt="..."
            />
          </div>
        </NotFoundContainer>
      )}
      {quizes.length > 0 && (
        <TableContainer component={Paper} sx={{ mt: 4 }}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>S.NO</TableCell>
                <TableCell>Quiz</TableCell>
                <TableCell>Time Limit</TableCell>
                <TableCell>No of Attempts</TableCell>
                <TableCell>Available From </TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Available Until</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {quizes.map((quiz, index) => {
                let {
                  name,
                  timeLimit,
                  timeLimitEnabled,
                  attemptsEnabled,
                  attempts,
                  availableFrom,
                  availableUntil,
                  dueDate,
                  _id,
                } = quiz;

                let dueDateExceeded = moment().isAfter(dueDate);

                return (
                  <TableRow
                    key={_id}
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                    }}
                  >
                    <TableCell component="th" scope="row">
                      {index + 1}
                    </TableCell>
                    <TableCell>{name}</TableCell>
                    <TableCell align="center">
                      {timeLimitEnabled ? `${formatTime(timeLimit)}` : "∞"}
                    </TableCell>
                    <TableCell align="center">
                      {attemptsEnabled ? `${attempts}` : "∞"}
                    </TableCell>
                    <TableCell>
                      <AvailableFromCountdownTimer
                        availableFrom={availableFrom}
                      />
                    </TableCell>
                    <TableCell
                      sx={{
                        color: dueDateExceeded ? "tomato" : "green",
                        fontWeight: "bold",
                      }}
                    >
                      {dueDate
                        ? moment(dueDate).format("MMM DD, YYYY - hh:mm A")
                        : "No Due Date"}
                    </TableCell>
                    <TableCell>
                      {moment(availableUntil).format("MMM DD, YYYY - hh:mm A")}
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => onStartQuiz(quiz)}
                        variant="outlined"
                        startIcon={<MdOutlineNotStarted />}
                        color="info"
                      >
                        Start Quiz
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[10, 20, 50, 100]}
                  labelRowsPerPage="Total Quiz Per Page"
                  count={totalQuizes}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  SelectProps={{
                    inputProps: {
                      "aria-label": "rows per page",
                    },
                    native: true,
                  }}
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

export default StudentQuiz;
