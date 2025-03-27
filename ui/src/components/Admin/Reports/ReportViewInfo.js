/* eslint-disable jsx-a11y/alt-text */
import { LoadingButton } from "@mui/lab";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import classes from "./ReportViewInfo.module.css";
import _, { filter } from "lodash";
import moment from "moment";
import { formatTimeWithSeconds, scrollToTop } from "../../../utility/helper";
import { FaCheck, FaTimes } from "react-icons/fa";
import {
  NotFoundContainer,
  NotFoundContainerImage,
  NotFoundText,
} from "../../../styles";
import hexToRgba from "hex-to-rgba";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Title,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      grid: {
        display: false,
      },
    },
  },
};

const ReportViewInfo = ({ report: reportData, setAttempt }) => {
  const [report, setReport] = useState(null);
  const [orgReport, setOrgReport] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterBy, setFilterBy] = useState(null);
  const [filters, setFilters] = useState([]);
  const [performancePieData, setperformancePieData] = useState(null);
  const [percentage, setPercentage] = useState(0);
  const [marksObtained, setMarksObtained] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    if (!reportData) {
      return;
    }
    if (reportData) {
      let {
        correctAnswers,
        incorrectAnswers,
        unattemptedAnswers,
        reviewMarkedAnswers,
      } = reportData;
      if (!reportData) {
        navigate("/student/reports");
        return;
      }
      let filterValues = [
        {
          value: "all",
          label: `All Questions`,
        },
        {
          value: "correct",
          label: `Correct (${correctAnswers || 0})`,
        },
        {
          value: "incorrect",
          label: `Incorrect (${incorrectAnswers || 0})`,
        },
        {
          value: "unattempted",
          label: `Unattempted (${unattemptedAnswers || 0})`,
        },
        {
          value: "review",
          label: `Marked for Review (${reviewMarkedAnswers || 0})`,
        },
      ];
      setFilterBy(filterValues.find((v) => v.value === "all"));
      setFilters(filterValues);
      setReport(reportData);
      setOrgReport(reportData);
      setQuiz(reportData.quiz);
      onSetPerformanceChartData(reportData);
    }
  }, [reportData]);

  // animation
  useEffect(() => {
    if (!report) {
      return;
    }
    const animationDuration = 1000; // milliseconds
    const framesPerSecond = 100;
    const increment =
      report.percentage / (animationDuration / 1000) / framesPerSecond;
    const marksIncrement =
      report.marksObtained / (animationDuration / 1000) / framesPerSecond;
    let currentPercentage = 0;
    let currentMarks = 0;

    const updatePercentage = () => {
      currentPercentage += increment;
      setPercentage(currentPercentage);
      if (currentPercentage < report.percentage) {
        requestAnimationFrame(updatePercentage);
      } else {
        setPercentage(report.percentage);
      }
    };

    const updateMarks = () => {
      currentMarks += marksIncrement;
      setMarksObtained(currentMarks);

      if (currentMarks < report.marksObtained) {
        requestAnimationFrame(updateMarks);
      } else {
        setMarksObtained(report.marksObtained);
      }
    };

    // Start the animation
    updatePercentage();
    updateMarks();
    // Cleanup on component unmount
    return () => {
      cancelAnimationFrame(updatePercentage);
      cancelAnimationFrame(updateMarks);
    };
  }, [report]);

  const onFinishReview = () => {
    setAttempt(null);
    scrollToTop();
  };

  function calculateLateSubmission(dueDateStr, submissionDateStr) {
    const dueDate = new Date(dueDateStr);
    const submissionDate = new Date(submissionDateStr);

    const timeDifference = submissionDate - dueDate;
    const lateMilliseconds = Math.max(timeDifference, 0);

    const days = Math.floor(lateMilliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (lateMilliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor(
      (lateMilliseconds % (1000 * 60 * 60)) / (1000 * 60)
    );
    const seconds = Math.floor((lateMilliseconds % (1000 * 60)) / 1000);

    let lateMessage = "";
    if (days > 0) {
      lateMessage += `${days}d `;
    }
    if (hours > 0) {
      lateMessage += `${hours}h `;
    }
    if (minutes > 0) {
      lateMessage += `${minutes}m `;
    }
    if (seconds > 0) {
      lateMessage += `${seconds}s`;
    }

    return lateMessage.trim();
  }

  const isLateSubmission = () => {
    if (quiz.dueDate) {
      return moment(report.submittedOn).isAfter(quiz.dueDate) && quiz.dueDate;
    }
    return false;
  };

  const fillInTheBlank = (question, answers) => {
    let filledQuestion = question;
    let index = 0;
    if (!answers || answers.length === 0) {
      filledQuestion = filledQuestion.replaceAll("#blank#", () => {
        return "<u> ______ </u>";
      });
    } else {
      filledQuestion = filledQuestion.replace(/#blank#/g, () => {
        const answer = answers[index++];
        return answer ? `<u><b>${answer}</u></b>` : "<u>______</u>";
      });
    }

    return filledQuestion;
  };

  const onFilterValueChange = (newValue) => {
    setFilterBy(newValue);
    if (quiz && newValue && newValue.value) {
      let value = newValue.value;
      let currentReport = _.cloneDeep(orgReport);
      let currentQuiz = currentReport.quiz;
      let currentQuestions = currentQuiz.questions;
      let currentAnswers = currentReport.answers;
      let finalAnswers = [];
      let finalQuestions = [];
      if (value === "correct") {
        finalAnswers = currentAnswers.filter((a) => a.isCorrect);
      } else if (value === "incorrect") {
        finalAnswers = currentAnswers.filter(
          (a) => !a.isCorrect && !a.unattempted
        );
      } else if (value === "unattempted") {
        finalAnswers = currentAnswers.filter((a) => a.unattempted);
      } else if (value === "review") {
        finalAnswers = currentAnswers.filter((a) => a.reviewMarked);
      } else if (value === "all") {
        finalAnswers = currentAnswers;
      }
      finalAnswers.forEach((a) => {
        let question = currentQuestions.find((q) => q._id === a.questionId);
        finalQuestions.push(question);
      });
      currentReport.answers = finalAnswers;
      currentReport.quiz.questions = finalQuestions;
      setReport(currentReport);
      setQuiz(currentReport.quiz);
    } else {
      setReport(orgReport);
      setQuiz(orgReport.quiz);
    }

    return;
  };

  const onSetPerformanceChartData = (report) => {
    let {
      correctAnswers,
      incorrectAnswers,
      unattemptedAnswers,
      reviewMarkedAnswers,
    } = report;
    const performancePie = {
      labels: [
        "Correct Answers",
        "Incorrect Answers",
        "Unattempted Answers",
        "Marked For Review",
      ],
      datasets: [
        {
          label: "Total",
          data: [
            correctAnswers || 0,
            incorrectAnswers || 0,
            unattemptedAnswers || 0,
            reviewMarkedAnswers || 0,
          ],
          backgroundColor: [
            hexToRgba("#4cae4e", 0.5),
            hexToRgba("#f54236", 0.5),
            hexToRgba("#3298FC", 0.5),
            hexToRgba("#FE9E68", 0.5),
          ],
          borderColor: [
            hexToRgba("#4cae4e", 0.5),
            hexToRgba("#f54236", 0.5),
            hexToRgba("#3298FC", 0.5),
            hexToRgba("#FE9E68", 0.5),
          ],
          borderWidth: 1,
        },
      ],
    };
    setperformancePieData(performancePie);
  };

  const getBatchNames = () => {
    if (report.user?.batches?.length > 0) {
      let batches = report.user.batches.map((b) => {
        return `${b.name} - ${b.code}`;
      });
      return batches.join(", ");
    } else {
      return " ------ ";
    }
  };

  return orgReport && quiz ? (
    <section>
      <Card className={`${classes.card} ${classes.infoCard}`}>
        <div className={classes.cardHeader}>
          <p className={classes.title}>Student Details & Quiz Info</p>
        </div>
        <div className={classes.cardContent}>
          <Grid container spacing={3}>
            <Grid item md={6}>
              <div className={classes.infoContainer}>
                <div className={classes.info}>
                  <p className={classes.infoTitle}>Student Name</p>
                  <p
                    className={classes.infoDesc}
                  >{`${report.user?.firstName} ${report.user?.lastName}`}</p>
                </div>
                <div className={classes.info}>
                  <p className={classes.infoTitle}>Email Address</p>
                  <p className={classes.infoDesc}>{report.user?.email}</p>
                </div>
                <div className={classes.info}>
                  <p className={classes.infoTitle}>Belongs to Batches</p>
                  <p className={classes.infoDesc}>{getBatchNames()}</p>
                </div>
              </div>
            </Grid>
            <Grid item md={6}>
              <div className={classes.infoContainer}>
                <div className={classes.info}>
                  <p className={classes.infoTitle}>Quiz Name</p>
                  <p className={classes.infoDesc}>{quiz.name}</p>
                </div>
                <div className={classes.info}>
                  <p className={classes.infoTitle}>Late Submission</p>
                  <p className={classes.infoDesc}>
                    {isLateSubmission()
                      ? `Late Submission By -  ${calculateLateSubmission(
                          quiz.dueDate,
                          report.submittedOn
                        )}`
                      : "No"}
                  </p>
                </div>
                <div className={classes.info}>
                  <p className={classes.infoTitle}>Submitted On</p>
                  <p className={classes.infoDesc}>
                    <span
                      className={`${
                        isLateSubmission() ? classes.red : classes.green
                      }`}
                    >
                      {moment(report.submittedOn).format(
                        "ddd,DD MMM YYYY - hh:mm:ss A"
                      )}
                    </span>
                  </p>
                </div>
              </div>
            </Grid>
          </Grid>
        </div>
      </Card>

      <Card className={classes.card}>
        <div className={classes.cardHeader}>
          <p className={classes.title}>Quiz Overview</p>
          <p className={classes.date}>
            Completed on -{" "}
            <span
              className={`${isLateSubmission() ? classes.red : classes.green}`}
            >
              {moment(report.submittedOn).format(
                "ddd,DD MMM YYYY - hh:mm:ss A"
              )}
              <br />
              {isLateSubmission() &&
                `Late Submission By -  ${calculateLateSubmission(
                  quiz.dueDate,
                  report.submittedOn
                )}`}
            </span>
          </p>
        </div>
        <div className={classes.cardContent}>
          <div className={classes.overviewItems}>
            <div className={classes.overview}>
              <img
                className={classes.icon}
                src={require("../../../assets/reports-marks-obtained.png")}
                alt="..."
              />
              <p className={classes.title}>{`${Math.round(marksObtained)}/${
                quiz.totalMarks
              }`}</p>
              <p className={classes.desc}>Marks Obtained</p>
            </div>
            <div className={classes.overview}>
              <img
                className={classes.icon}
                src={require("../../../assets/reports-scrore.png")}
                alt="..."
              />
              <p className={classes.title}>{Math.round(percentage)}%</p>
              <p className={classes.desc}>Your Score</p>
            </div>
            <div className={classes.overview}>
              <img
                className={classes.icon}
                src={require("../../../assets/reports-time-taken.png")}
                alt="..."
              />
              <p className={classes.title}>
                {formatTimeWithSeconds(report.timeSpentInSeconds)}
              </p>
              <p className={classes.desc}>Time Taken</p>
            </div>
            <div className={classes.overview}>
              <img
                className={classes.icon}
                src={require("../../../assets/reports-pass-result.png")}
                alt="..."
              />
              <p
                className={classes.title}
                style={{
                  color: report.result === "pass" ? "green" : "red",
                }}
              >
                {_.toUpper(report.result)}
              </p>
              <p className={classes.desc}>Result</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className={`${classes.card} ${classes.perfCard}`}>
        <div className={classes.cardHeader}>
          <p className={classes.title}>Quiz Performance Report</p>
        </div>
        <Grid container>
          <Grid item md={8}>
            <div className={classes.cardContent}>
              <div className={classes.perfContainer}>
                {/* questions */}
                <div className={classes.perf}>
                  <p className={classes.perfTitle}>Total Questions</p>
                  <p className={classes.perfDesc}>{quiz.questions.length}</p>
                </div>

                {/* correct */}
                <div className={classes.perf}>
                  <p className={classes.perfTitle}>Correct Answers</p>
                  <p className={classes.perfDesc}>
                    {report.correctAnswers || 0}
                  </p>
                </div>

                {/* incorrect */}
                <div className={classes.perf}>
                  <p className={classes.perfTitle}>Incorrect Answers</p>
                  <p className={classes.perfDesc}>
                    {report.incorrectAnswers || 0}
                  </p>
                </div>

                {/* Unattempted */}
                <div className={classes.perf}>
                  <p className={classes.perfTitle}>Unattempted Answers</p>
                  <p className={classes.perfDesc}>
                    {report.unattemptedAnswers || 0}
                  </p>
                </div>

                {/* Review */}
                <div className={classes.perf}>
                  <p className={classes.perfTitle}>Marked For Review</p>
                  <p className={classes.perfDesc}>
                    {report.reviewMarkedAnswers || 0}
                  </p>
                </div>
              </div>
            </div>
          </Grid>
          <Grid item md={4}>
            <div className={classes.perfChart}>
              <Pie
                data={performancePieData}
                options={{
                  ...chartOptions,
                  scales: {
                    ...chartOptions.scales,
                    y: {
                      ...chartOptions.scales.y,
                      ticks: {
                        display: false,
                        beginAtZero: true,
                      },
                    },
                    x: {
                      ...chartOptions.scales.x,
                      ticks: {
                        display: false,
                        beginAtZero: true,
                      },
                    },
                  },
                }}
              />
            </div>
          </Grid>
        </Grid>
      </Card>

      <Card className={`${classes.card} ${classes.reviewCard}`}>
        <div className={classes.cardHeader}>
          <p className={classes.title}>Review the Answers</p>
          {filters && filters.length > 0 && (
            <Autocomplete
              disablePortal
              className="mt-1"
              options={filters}
              sx={{
                minWidth: 250,
              }}
              value={filterBy || null}
              onChange={(e, newValue) => {
                onFilterValueChange(newValue);
              }}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => (
                <TextField variant="standard" {...params} label="Filter By " />
              )}
            />
          )}
        </div>
      </Card>

      {quiz.questions.map((question, i) => {
        let { questionText, questionType, options, _id } = question;
        let answers = report.answers;
        let answer = answers.find((a) => a.questionId === _id);
        let {
          isCorrect,
          unattempted,
          reviewMarked,
          selectedOption,
          selectedOptions,
        } = answer;
        let correctAnswer = isCorrect && !unattempted && !reviewMarked;
        let correctAnswerAndReviewMarked =
          isCorrect && !unattempted && reviewMarked;

        let incorrectAnswer = !isCorrect && !unattempted && !reviewMarked;
        let incorrectAndReviewMarked =
          !isCorrect && reviewMarked && !unattempted;
        let unattemptedAnswer = unattempted && !reviewMarked;
        let unattemptedAndReviewMarked = unattempted && reviewMarked;
        let greenClass =
          correctAnswer ||
          unattemptedAnswer ||
          correctAnswerAndReviewMarked ||
          unattemptedAndReviewMarked;
        let blankCorrectAnswers = [];
        if (questionType === "fill_in_the_blank") {
          blankCorrectAnswers = options.map((o) => o.optionText);
        }

        return (
          <Card key={i} className={`${classes.card} ${classes.qstnCard}`}>
            <div
              className={`${classes.qstnCardHeader} ${
                greenClass ? classes.green : classes.red
              } `}
            >
              <p className={classes.title}>
                Question -{" "}
                <b>
                  {orgReport.quiz.questions.findIndex((q) => q._id === _id) + 1}
                </b>
              </p>
              {correctAnswer && <p className={`${classes.status}`}>Correct</p>}
              {incorrectAnswer && (
                <p className={`${classes.status}`}>Incorrect</p>
              )}

              {unattemptedAnswer && (
                <p className={`${classes.statusText}`}>Unattempted</p>
              )}

              {correctAnswerAndReviewMarked && (
                <div className={classes.statusContainer}>
                  <p className={`${classes.status}`}>Correct</p>
                  <p className={`${classes.statusText}`}>Marked for review</p>
                </div>
              )}

              {incorrectAndReviewMarked && (
                <div className={classes.statusContainer}>
                  <p className={`${classes.status}`}>Incorrect</p>
                  <p className={`${classes.statusText}`}>Marked for review</p>
                </div>
              )}

              {unattemptedAndReviewMarked && (
                <p className={`${classes.statusText}`}>
                  Unattempted Marked for review
                </p>
              )}
            </div>

            <div className={classes.qstnCardContent}>
              {questionType !== "fill_in_the_blank" && (
                <p className={classes.qstn}>{questionText}</p>
              )}
              {questionType === "fill_in_the_blank" && (
                <p
                  dangerouslySetInnerHTML={{
                    __html: fillInTheBlank(questionText, selectedOptions || []),
                  }}
                  className={classes.qstn}
                />
              )}
              <div className={classes.optionsContainer}>
                {["single_option"].includes(questionType) && (
                  <>
                    <FormControl>
                      <RadioGroup
                        name="radio-buttons-group"
                        value={selectedOption || null}
                      >
                        {options.map((o, i) => {
                          let { optionText, isCorrect } = o;
                          let label = optionText;
                          let correctOption = isCorrect;
                          const selected = optionText === selectedOption;
                          let inCorrectOption = selected && !isCorrect;

                          return (
                            <div key={i}>
                              <FormControlLabel
                                value={optionText}
                                control={<Radio />}
                                label={
                                  <div className={classes.chipContainer}>
                                    <p className={classes.optionText}>
                                      {label}
                                    </p>
                                    {inCorrectOption && (
                                      <div
                                        className={`${classes.chip} ${classes.wrong}`}
                                      >
                                        <FaTimes className={classes.chipIcon} />
                                        <p>wrong</p>
                                      </div>
                                    )}
                                    {correctOption && (
                                      <div
                                        className={`${classes.chip} ${classes.right}`}
                                      >
                                        <FaCheck className={classes.chipIcon} />
                                        <p>right</p>
                                      </div>
                                    )}
                                  </div>
                                }
                              />
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </FormControl>
                  </>
                )}

                {["multiple_options"].includes(questionType) && (
                  <>
                    {options.map((o, i) => {
                      let { optionText, isCorrect } = o;
                      let label = optionText;
                      let correctOption = isCorrect;
                      const selected = selectedOptions.includes(optionText);
                      let inCorrectOption = selected && !isCorrect;
                      return (
                        <div key={i}>
                          <FormGroup>
                            <FormControlLabel
                              checked={selected}
                              value={label}
                              control={<Checkbox />}
                              label={
                                <div className={classes.chipContainer}>
                                  <p className={classes.optionText}>{label}</p>
                                  {inCorrectOption && (
                                    <div
                                      className={`${classes.chip} ${classes.wrong}`}
                                    >
                                      <FaTimes className={classes.chipIcon} />
                                      <p>wrong</p>
                                    </div>
                                  )}
                                  {correctOption && (
                                    <div
                                      className={`${classes.chip} ${classes.right}`}
                                    >
                                      <FaCheck className={classes.chipIcon} />
                                      <p>right</p>
                                    </div>
                                  )}
                                </div>
                              }
                            />
                          </FormGroup>
                        </div>
                      );
                    })}
                  </>
                )}

                {["fill_in_the_blank"].includes(questionType) && (
                  <>
                    <p>
                      Correct Options are :{" "}
                      <strong>{blankCorrectAnswers.join(", ")}</strong>{" "}
                    </p>
                  </>
                )}
              </div>
            </div>
          </Card>
        );
      })}

      {quiz.questions.length === 0 && (
        <NotFoundContainer>
          <div>
            <NotFoundText>
              No Data Available ! <br />
            </NotFoundText>
            <NotFoundContainerImage
              src={require("../../../assets/no_data.png")}
              alt="..."
            />
          </div>
        </NotFoundContainer>
      )}

      <Box
        sx={{
          marginTop: 10,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Button
          onClick={onFinishReview}
          fullWidth
          sx={{
            borderRadius: 50,
          }}
          variant="contained"
        >
          Finish Review
        </Button>
      </Box>
    </section>
  ) : null;
};

export default ReportViewInfo;
