import { useContext, useEffect, useState } from "react";
import classes from "./StudentReports.module.css";
import { ReportsContext } from "../../../services/Reports/Reports.context";
import {
  NotFoundContainer,
  NotFoundContainerImage,
  NotFoundText,
} from "../../../styles";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@mui/material";
import moment from "moment";
import {
  formatTime,
  formatTimeWithSeconds,
  getSubString,
} from "../../../utility/helper";
import { FaRegEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import _ from "lodash";

const StudentReports = ({ title }) => {
  const { onGetReports } = useContext(ReportsContext);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = title;
    getReports();
  }, []);

  const getReports = (query = "?reportsBy=quiz") => {
    onGetReports(
      query,
      (result) => {
        setLoading(false);
        setReports(result.reports);
      },
      () => {
        setLoading(false);
      },
      true,
      false
    );
  };

  const [sort, setSort] = useState({
    type: "desc",
    field: null,
  });

  const onChangeSorting = (fieldToSort) => {
    var currentReports = reports;
    let type = sort.type === "asc" ? "desc" : "asc";
    let fields = ["percentage"];
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
      {reports.length === 0 && !loading && (
        <NotFoundContainer>
          <div>
            <NotFoundText>
              No Reports Available ! <br />
            </NotFoundText>
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
                <TableCell>Name</TableCell>
                <TableCell>Marks </TableCell>
                <TableCell>
                  {" "}
                  <TableSortLabel
                    direction={
                      sort.type && sort.type === "desc" ? "asc" : "desc"
                    }
                    active
                    onClick={() => onChangeSorting("percentage")}
                  >
                    Percentage
                  </TableSortLabel>
                </TableCell>
                <TableCell>Time Taken</TableCell>
                <TableCell>Completed On</TableCell>
                <TableCell>Result</TableCell>
                <TableCell>Report</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report, index) => {
                let {
                  submittedOn,
                  marksObtained,
                  percentage,
                  timeSpentInSeconds,
                  result,
                  quiz,
                  _id,
                } = report;
                let { name, dueDate, totalMarks } = quiz;
                let lateSubmission = moment(submittedOn).isAfter(dueDate);
                let isPass = result === "pass";
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
                    <TableCell>{getSubString(name, 80)}</TableCell>
                    <TableCell>{`${marksObtained}/${totalMarks}`}</TableCell>
                    <TableCell>{`${percentage}%`}</TableCell>
                    <TableCell>
                      {formatTimeWithSeconds(timeSpentInSeconds)}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: lateSubmission ? "red" : "green",
                      }}
                    >
                      {/* Wed, 02 Aug 2023 */}
                      {moment(submittedOn).format("ddd, DD MMM YYYY")}
                      <br />
                      {moment(submittedOn).format("hh:mm:ss A")}
                      {lateSubmission && (
                        <p className="mt-0-5"> Late Submission </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <img
                        className={classes.resultImg}
                        src={require(`../../../assets/${
                          isPass ? "pass.png" : "fail.png"
                        }`)}
                        alt="..."
                      />
                    </TableCell>
                    <TableCell
                      onClick={() => navigate(`view?id=${_id}`)}
                      sx={{
                        cursor: "pointer",
                      }}
                    >
                      <FaRegEye size={25} color="#3FC8FE" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
};

export default StudentReports;
