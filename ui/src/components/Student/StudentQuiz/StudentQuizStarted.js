/* eslint-disable no-loop-func */
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  Paper,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import classes from "./StudentQuizStarted.module.css";
import React, { useCallback, useContext, useEffect, useState } from "react";
import Swal from "sweetalert2";
import _ from "lodash";
import {
  MdChevronLeft,
  MdChevronRight,
  MdFullscreen,
  MdOutlineTimer,
} from "react-icons/md";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import useExitPrompt from "../../../hooks/useExitPrompt";
import { useNavigate } from "react-router-dom";
import { QuizContext } from "../../../services/Quiz/Quiz.context";
import { scrollToElement, scrollToTop } from "../../../utility/helper";

const StudentQuizStarted = ({ started, setStarted, quiz }) => {
  const [question, setQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const { onSubmitQuiz } = useContext(QuizContext);
  const [questions, setQuestions] = useState(_.shuffle(quiz.questions));
  const [answeredQuestionsIndexes, setAnsweredQuestionsIndexes] = useState([]);
  const [reviewMarkedQuestionsIndexes, setReviewMarkedQuestionsIndexes] =
    useState([]);
  const [showExitPrompt, setShowExitPrompt] = useExitPrompt(true);
  const [startTime, setStartTime] = useState(new Date());
  const [reviewModal, setReviewModal] = useState(false);
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(
    quiz.timeLimitEnabled ? quiz.timeLimit * 60 : 0
  );
  const fullScreen = useFullScreenHandle();

  useEffect(() => {
    let timer;
    if (quiz.timeLimitEnabled) {
      timer = setInterval(() => {
        setTimeLeft((prevTimeLeft) => {
          if (prevTimeLeft > 0) {
            return prevTimeLeft - 1;
          } else {
            clearInterval(timer);
            onTimerEnd();
          }
        });
      }, 1000);
    }

    return () => {
      clearInterval(timer);
    };
  }, [quiz.timeLimitEnabled]);

  useEffect(() => {
    if (typeof currentQuestionIndex === "number" && quiz) {
      setQuestion(questions[currentQuestionIndex]);
      scrollToElement("quizCard", 85);
    }
  }, [currentQuestionIndex]);

  useEffect(() => {
    return () => {
      setShowExitPrompt(false);
    };
  }, []);

  const onTimerEnd = () => {
    Swal.fire({
      title: "You ran out of time!",
      html: `your answers will be auto submitted now, Thank You for attempting the quiz`,
      showCancelButton: false,
      confirmButtonText: "Continue & Submit",
      icon: "info",
      confirmButtonColor: "var(--primary)",
    }).then((result) => {
      onSubmit(true);
    });
  };

  const onFullScreenChange = useCallback(
    (state, handle) => {
      if (handle === fullScreen) {
      }
    },
    [fullScreen]
  );

  const onExitQuiz = () => {
    Swal.fire({
      title: "Please Confirm?",
      html: `Do you wish to exit the exam without submitting?`,
      showCancelButton: true,
      confirmButtonText: "Quit Exam",
      icon: "warning",
      focusCancel: true,
      confirmButtonColor: "tomato",
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        scrollToTop();

        setStarted(false);
      }
    });
  };

  const onClickPreviousQuestion = () => {
    if (currentQuestionIndex === 0) {
      return;
    }
    setCurrentQuestionIndex(currentQuestionIndex - 1);
    scrollToElement("quizCard", 85);
  };

  const onClickNextQuestion = () => {
    let questionsLength = questions.length;
    if (questionsLength - 1 === currentQuestionIndex) {
      return;
    }
    setCurrentQuestionIndex(currentQuestionIndex + 1);
    scrollToElement("quizCard", 85);
  };

  const fillInTheBlank = () => {
    let qstn = "Q." + question.questionText;
    const regex = /#blank#/g;
    // Split the string into parts using the regex
    const parts = qstn.split(regex);
    // Replace each occurrence of '#blank#' with an Input component
    const replacedQstn = parts.map((part, index) => {
      if (index < parts.length - 1) {
        // If not the last part, append an Input component
        return (
          <React.Fragment key={index}>
            {part}
            <input
              value={question?.selectedOptions?.[index] || ""}
              onChange={(e) =>
                onQuestionValueChangeHandler(e.target.value, index)
              }
            />
          </React.Fragment>
        );
      } else {
        // If the last part, just return the last part
        return part;
      }
    });
    return replacedQstn;
    let filledQuestion = qstn.replaceAll("#blank#", `<input />`);
    return filledQuestion;
  };

  const fillInTheBlankReviewAttempt = (question) => {
    let filledQuestion = question;

    filledQuestion = filledQuestion.replaceAll("#blank#", () => {
      return " ______ ";
    });

    return filledQuestion;
  };

  const onQuestionValueChangeHandler = (value, index = null) => {
    let { questionType } = question;
    if (questionType === "single_option") {
      question.selectedOption = value;
    } else if (questionType === "multiple_options") {
      let selectedOptions = _.cloneDeep(question.selectedOptions || []);
      let alreadyExists = selectedOptions.find((option) => option === value);
      if (alreadyExists) {
        selectedOptions = selectedOptions.filter((option) => option !== value);
      } else {
        selectedOptions.push(value);
      }
      question.selectedOptions = selectedOptions;
    } else if (questionType === "fill_in_the_blank") {
      let selectedOptions = _.cloneDeep(question.selectedOptions || []);
      if (!value.trim() || value === "") {
        selectedOptions[index] = "";
      } else {
        selectedOptions[index] = value;
      }
      question.selectedOptions = selectedOptions;
    }
    let currentQuestions = _.cloneDeep(questions);
    currentQuestions[currentQuestionIndex] = question;
    setQuestion(question);
    setQuestions(currentQuestions);
    let currentAnsweredIndexes = _.cloneDeep(answeredQuestionsIndexes);
    if (question) {
      const addToAnsweredQuestions = () => {
        currentAnsweredIndexes = _.union(currentAnsweredIndexes, [
          currentQuestionIndex,
        ]);
      };
      const removeFromAnsweredQuestions = () => {
        currentAnsweredIndexes = _.without(
          currentAnsweredIndexes,
          currentQuestionIndex
        );
      };

      if (questionType === "single_option") {
        addToAnsweredQuestions();
      } else if (
        questionType === "multiple_options" &&
        question.selectedOptions?.length > 0
      ) {
        addToAnsweredQuestions();
      } else if (
        questionType === "fill_in_the_blank" &&
        question.selectedOptions.length > 0 &&
        !_.every(question.selectedOptions, _.isEmpty)
      ) {
        addToAnsweredQuestions();
      } else {
        removeFromAnsweredQuestions();
      }
    }
    setAnsweredQuestionsIndexes(currentAnsweredIndexes);
  };

  const onAddForReview = () => {
    let finalItems = [];
    if (_.includes(reviewMarkedQuestionsIndexes, currentQuestionIndex)) {
      // Value exists, remove it
      finalItems = _.without(
        reviewMarkedQuestionsIndexes,
        currentQuestionIndex
      );
    } else {
      // Value doesn't exist, push it as a unique value
      finalItems = _.union(reviewMarkedQuestionsIndexes, [
        currentQuestionIndex,
      ]);
    }
    setReviewMarkedQuestionsIndexes(finalItems);
  };

  const formatTimer = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || timeInSeconds <= 0) {
      return "00:00:00";
    }

    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;

    const formatTwoDigits = (number) => (number < 10 ? `0${number}` : number);

    return `${formatTwoDigits(hours)}:${formatTwoDigits(
      minutes
    )}:${formatTwoDigits(seconds)}`;
  };

  const onSubmit = (timerExists = false) => {
    fullScreen.exit();
    const timeSpentInSeconds = Math.floor((new Date() - startTime) / 1000);

    const onConfirmSubmit = () => {
      // Calculate the time spent on the quiz in minutes
      //   const timeSpentInSeconds = Math.floor(timeSpentInSeconds / 60);
      let data = {
        timeSpentInSeconds: timeSpentInSeconds,
      };
      let structuredQuestions = [];
      questions.forEach((q, i) => {
        let { _id, selectedOption, selectedOptions, questionType } = q;
        let obj = {
          _id: _id,
        };
        if (questionType === "single_option") {
          obj.selectedOption = selectedOption || null;
        } else {
          obj.selectedOptions = selectedOptions || [];
        }
        if (reviewMarkedQuestionsIndexes.includes(i)) {
          obj.reviewMarked = true;
        }
        structuredQuestions.push(obj);
      });
      data.questions = structuredQuestions;
      onSubmitQuiz(
        quiz._id,
        data,
        (result) => {
          setShowExitPrompt(false);
          setStarted(false);
          navigate(`/student/reports/view?id=${result.quizAttemptId}`);
        },
        (error) => {}
      );
    };

    if (!timerExists) {
      Swal.fire({
        title: "Please Confirm?",
        html: `Do you wish to submit the exam?`,
        cancelButtonColor: "#ccc",
        showCancelButton: true,
        confirmButtonText: "Submit Quiz",
        icon: "warning",
        focusCancel: true,
        confirmButtonColor: "var(--primary)",
      }).then((result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          onConfirmSubmit();
        }
      });
    } else {
      onConfirmSubmit();
    }
  };

  const onCloseReviewModal = () => {
    setReviewModal(false);
  };

  const onClickViewAttempt = (index) => {
    setCurrentQuestionIndex(index);
    onCloseReviewModal();
  };

  return question ? (
    <FullScreen handle={fullScreen} onChange={onFullScreenChange}>
      <div className={classes.dummyHeaderContainer}>
        <div className={classes.dummyHeader}>
          <p>Quiz Name - {quiz.name}</p>
        </div>
      </div>
      <div className={classes.quizCard} id="quizCard">
        <div className={classes.quizCardHeader}>
          <p>
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
          <div className={classes.timerContainer}>
            {quiz.timeLimitEnabled && (
              <div className={classes.timer}>
                <MdOutlineTimer />
                <b>{formatTimer(timeLeft)}</b> left
              </div>
            )}

            <button onClick={onExitQuiz} className={classes.exitButton}>
              Exit Quiz
            </button>
          </div>
        </div>

        <div className={classes.quizCardContent}>
          <div
            className={`${classes.questionContainer} ${
              fullScreen.active ? classes.fullScreen : ""
            }`}
          >
            {question.questionType === "fill_in_the_blank" && (
              <div
                className={`${classes.question} ${classes.blank}`}
                // dangerouslySetInnerHTML={{ __html: fillInTheBlank() }}
              >
                {fillInTheBlank()}
              </div>
            )}

            {question.questionType !== "fill_in_the_blank" && (
              <p className={classes.question}>Q. {question.questionText}</p>
            )}

            {question.questionType !== "fill_in_the_blank" && (
              <div className={classes.optionsContainer}>
                {["single_option"].includes(question.questionType) && (
                  <>
                    <FormControl>
                      <RadioGroup
                        name="radio-buttons-group"
                        onChange={(e) =>
                          onQuestionValueChangeHandler(e.target.value)
                        }
                        value={question.selectedOption || null}
                      >
                        {question.options.map((o, i) => {
                          let { optionText } = o;
                          let label = optionText;
                          let selected = optionText === question.selectedOption;

                          return (
                            <div
                              className={`${classes.option} ${
                                selected ? classes.selected : ""
                              }`}
                              key={i}
                            >
                              <FormControlLabel
                                value={optionText}
                                control={<Radio />}
                                label={label}
                              />
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </FormControl>
                  </>
                )}

                {["multiple_options"].includes(question.questionType) && (
                  <>
                    {question.options.map((o, i) => {
                      let { optionText } = o;
                      let label = optionText;
                      let selected =
                        question.selectedOptions?.includes(optionText);

                      return (
                        <div
                          className={`${classes.option} ${
                            selected ? classes.selected : ""
                          }`}
                          key={i}
                        >
                          <FormGroup>
                            <FormControlLabel
                              key={i}
                              checked={_.includes(
                                question.selectedOptions,
                                optionText
                              )}
                              value={optionText}
                              onChange={(e) => {
                                let value = e.target.value;
                                onQuestionValueChangeHandler(value);
                              }}
                              control={<Checkbox />}
                              label={label}
                            />
                          </FormGroup>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            <div className={classes.quizCardFooter}>
              <button
                onClick={onClickPreviousQuestion}
                className={`${classes.button} ${
                  currentQuestionIndex === 0 ? classes.disabled : ""
                }`}
              >
                <MdChevronLeft size={20} />
                Prev
              </button>
              <FormGroup>
                <FormControlLabel
                  onChange={(e) => onAddForReview()}
                  control={
                    <Checkbox
                      color="error"
                      checked={_.includes(
                        reviewMarkedQuestionsIndexes,
                        currentQuestionIndex
                      )}
                    />
                  }
                  label={"Mark for review"}
                />
              </FormGroup>

              {currentQuestionIndex === questions.length - 1 ? (
                <button
                  className={`${classes.button} 
        }`}
                  onClick={() => onSubmit()}
                >
                  Submit Quiz
                </button>
              ) : (
                <button
                  className={`${classes.button} ${
                    currentQuestionIndex === questions.length - 1
                      ? classes.disabled
                      : ""
                  }`}
                  onClick={onClickNextQuestion}
                >
                  Next
                  <MdChevronRight size={20} />
                </button>
              )}
            </div>
          </div>

          <div className={classes.reviewContainer}>
            <button
              className={classes.reviewButton}
              onClick={() => setReviewModal(true)}
            >
              Review Attempt
            </button>
            <div className={classes.reviews}>
              {questions.map((ques, i) => {
                let isActive = i === currentQuestionIndex;
                let answered = answeredQuestionsIndexes.includes(i)
                  ? true
                  : false;
                let reviewMarkedAnswered =
                  reviewMarkedQuestionsIndexes.includes(i) && answered
                    ? true
                    : false;
                let reviewMarkedNotAnswered =
                  reviewMarkedQuestionsIndexes.includes(i) && !answered
                    ? true
                    : false;
                return (
                  <div
                    key={i}
                    onClick={() => setCurrentQuestionIndex(i)}
                    className={`${classes.review} ${
                      isActive ? classes.active : ""
                    } ${answered ? classes.answered : ""}  ${
                      reviewMarkedAnswered ? classes.reviewMarkedAnswered : ""
                    } ${
                      reviewMarkedNotAnswered
                        ? classes.reviewMarkedNotAnswered
                        : ""
                    }`}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </div>
          <div className={classes.fullScreenMode}>
            <Button
              variant="contained"
              color="info"
              startIcon={<MdFullscreen />}
              onClick={fullScreen.active ? fullScreen.exit : fullScreen.enter}
              sx={{
                textTransform: "none",
              }}
            >
              {fullScreen.active
                ? "Exit Fullscreen Mode"
                : "Switch to Fullscreen Mode"}
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        onClose={onCloseReviewModal}
        open={reviewModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Review Your Answers</DialogTitle>
        <DialogContent sx={{}}>
          <div className={classes.reviewTable}>
            <TableContainer component={Paper}>
              <Table aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>No</TableCell>
                    <TableCell>Question</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>View</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {questions.map((q, i) => {
                    let { questionText, questionType } = q;
                    questionText =
                      questionType === "fill_in_the_blank"
                        ? fillInTheBlankReviewAttempt(questionText)
                        : questionText;
                    let name =
                      questionText.length > 80
                        ? questionText.substring(0, 80) + "..."
                        : questionText;
                    let status = reviewMarkedQuestionsIndexes.includes(i)
                      ? "Review"
                      : answeredQuestionsIndexes.includes(i)
                      ? "Answered"
                      : "Unanswered";
                    return (
                      <TableRow
                        key={i}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell component="th" scope="row">
                          {i + 1}
                        </TableCell>
                        <TableCell>{name}</TableCell>
                        <TableCell>{status}</TableCell>
                        <TableCell>
                          <button
                            onClick={() => onClickViewAttempt(i)}
                            className={classes.viewButton}
                          >
                            View
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: "center",
            gap: 2,
          }}
        >
          <Button
            variant="contained"
            sx={{
              width: 150,
            }}
            onClick={() => {
              onCloseReviewModal();
              onSubmit();
            }}
          >
            Submit
          </Button>
          <Button
            onClick={onCloseReviewModal}
            variant="contained"
            sx={{
              backgroundColor: "#bbb",
              ":hover": {
                backgroundColor: "#bbb",
              },
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </FullScreen>
  ) : null;
};

export default StudentQuizStarted;
