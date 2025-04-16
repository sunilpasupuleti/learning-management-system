import { useContext, useEffect, useState } from "react";
import { QuizContext } from "../../../services/Quiz/Quiz.context";
import { useNavigate, useSearchParams } from "react-router-dom";
import classes from "./StudentQuiz.module.css";
import moment from "moment";
import { Button, Card, CardContent, Grid, Typography } from "@mui/material";
import {
  MdOutlineAvTimer,
  MdOutlineNotStarted,
  MdCheckCircleOutline,
  MdOutlineTimelapse,
} from "react-icons/md";
import { FaPencilAlt } from "react-icons/fa";
import { LuClipboardList, LuThumbsUp } from "react-icons/lu";
import StudentQuizStarted from "./StudentQuizStarted";
import Swal from "sweetalert2";
import { formatTime, scrollToTop } from "../../../utility/helper";

const StudentQuizStart = ({ title }) => {
  const [quiz, setQuiz] = useState(null);
  const { onGetQuiz } = useContext(QuizContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [started, setStarted] = useState(false);
  const navigate = useNavigate();
  let quizId = searchParams.get("id");

  useEffect(() => {
    getQuiz();
  }, [quizId]);

  useEffect(() => {
    document.title = title;
  }, []);

  const getQuiz = () => {
    onGetQuiz(
      quizId,
      (result) => {
        console.log(result);
        scrollToTop();
        document.title = result.quiz?.name;
        setQuiz(result.quiz);
      },
      (error) => {
        navigate("/student/quiz");
      },
      true,
      false
    );
  };

  const onStartQuiz = () => {
    scrollToTop();

    if (
      quiz.attemptsEnabled &&
      quiz.attemptsCount &&
      quiz.attemptsCount >= quiz.attempts
    ) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "You have reached maximum number of attempts",
      });
      return;
    }
    let desc = quiz.timeLimitEnabled
      ? `The quiz has a time limit of <strong>
    ${formatTime(quiz.timeLimit)}
    </strong>, Time will cound down from the moment you start your attempt and you must submit before it expires or quiz will be auto submitted.`
      : `This quiz has no time limit. Take your time to answer all questions, and
    when you're ready, click the "Start Quiz" button below.`;
    Swal.fire({
      title: "Start Exam Now?",
      html: desc,
      showCancelButton: true,
      confirmButtonText: "Start Quiz",
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        scrollToTop();

        setStarted(true);
      }
    });
  };

  return quiz ? (
    <div>
      {!started && (
        <div className={classes.overviewContainer}>
          <div className={classes.quizTitle}>
            Quiz Name - <strong>{quiz.name}</strong>
          </div>

          <Grid container columnSpacing={3}>
            {quiz.description && (
              <Grid item md={8}>
                <div className={classes.descriptionContainer}>
                  <h3>
                    <i>Description : </i>
                  </h3>
                  <div
                    className={classes.description}
                    dangerouslySetInnerHTML={{ __html: quiz.description }}
                  />
                </div>
              </Grid>
            )}

            <Grid item md={quiz.description ? 4 : 12}>
              <Card
                sx={{
                  minWidth: 275,
                  mt: 3,
                  mb: 2,
                  boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
                }}
              >
                <CardContent>
                  <Grid container spacing={3} rowSpacing={5}>
                    <Grid item md={6}>
                      <div className={classes.detailContainer}>
                        <div
                          className={`${classes.detailIcon} ${classes.questions}`}
                        >
                          <LuClipboardList />
                        </div>
                        <div className={classes.detail}>
                          <p className={classes.title}>
                            {quiz.questions.length}
                          </p>
                          <p className={classes.desc}>Questions</p>
                        </div>
                      </div>
                    </Grid>
                    <Grid item md={6}>
                      <div className={classes.detailContainer}>
                        <div
                          className={`${classes.detailIcon} ${classes.timer}`}
                        >
                          <MdOutlineAvTimer />
                        </div>
                        <div className={classes.detail}>
                          <p className={classes.title}>
                            {quiz.timeLimitEnabled
                              ? formatTime(quiz.timeLimit)
                              : "∞"}
                          </p>
                          <p className={classes.desc}>Time</p>
                        </div>
                      </div>
                    </Grid>
                    <Grid item md={6}>
                      <div className={classes.detailContainer}>
                        <div
                          className={`${classes.detailIcon} ${classes.marks}`}
                        >
                          <MdCheckCircleOutline />
                        </div>
                        <div className={classes.detail}>
                          <p className={classes.title}>{quiz.totalMarks}</p>
                          <p className={classes.desc}>Max.Marks</p>
                        </div>
                      </div>
                    </Grid>
                    <Grid item md={6}>
                      <div className={classes.detailContainer}>
                        <div
                          className={`${classes.detailIcon} ${classes.pass}`}
                        >
                          <LuThumbsUp />
                        </div>
                        <div className={classes.detail}>
                          <p className={classes.title}>
                            {quiz.passPercentage} %
                          </p>
                          <p className={classes.desc}>Passing</p>
                        </div>
                      </div>
                    </Grid>
                    {/* attempts */}
                    {quiz.attemptsEnabled && (
                      <>
                        <Grid item md={6}>
                          <div className={classes.detailContainer}>
                            <div
                              className={`${classes.detailIcon} ${classes.attemptsRemain}`}
                            >
                              <MdOutlineTimelapse />
                            </div>
                            <div className={classes.detail}>
                              <p className={classes.title}>
                                {quiz.attempts - quiz.attemptsCount} /{" "}
                                {quiz.attempts}
                              </p>
                              <p className={classes.desc}>Remaining Attempts</p>
                            </div>
                          </div>
                        </Grid>

                        <Grid item md={6}>
                          <div className={classes.detailContainer}>
                            <div
                              className={`${classes.detailIcon} ${classes.attemptsTaken}`}
                            >
                              <FaPencilAlt />
                            </div>
                            <div className={classes.detail}>
                              <p className={classes.title}>
                                {quiz.attemptsCount}
                              </p>
                              <p className={classes.desc}>Attempts Taken</p>
                            </div>
                          </div>
                        </Grid>
                      </>
                    )}

                    <Grid item md={12}>
                      <Button
                        fullWidth
                        disabled={
                          quiz.attemptsEnabled &&
                          quiz.attemptsCount &&
                          quiz.attemptsCount >= quiz.attempts
                        }
                        onClick={() => onStartQuiz()}
                        variant="contained"
                        startIcon={<MdOutlineNotStarted />}
                      >
                        Start Quiz
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <div className={classes.instructionsContainer}>
            <h3>
              <i>Quiz Instructions</i> :
            </h3>
            <div className={classes.instructions}>
              <ul>
                <li>
                  This quiz offers a diverse set of question types, including
                  single-choice, multiple-choice, and fill-in-the-blanks. Get
                  ready for a well-rounded challenge!
                </li>
                {quiz.timeLimitEnabled && (
                  <li>
                    Please note that you have a time limit of{" "}
                    <b>{formatTime(quiz.timeLimit)} Minutes</b> from the moment
                    you start. Make sure to manage your time wisely, and good
                    luck!
                  </li>
                )}

                {!quiz.timeLimitEnabled && (
                  <li>
                    You have unlimited time to complete it, so take your time
                    and do your best. Good luck!
                  </li>
                )}
                {quiz.attemptsEnabled && (
                  <li>
                    Please note that you have a total of{" "}
                    <b>{quiz.attempts} attempts</b> to complete this quiz. Make
                    sure to review your answers carefully before submitting each
                    attempt. Good luck!
                  </li>
                )}
                {!quiz.attemptsEnabled && (
                  <li>
                    You have unlimited attempts to complete this quiz, so feel
                    free to try as many times as you need to achieve your best
                    score. Good luck!
                  </li>
                )}

                <li>
                  It consists of{" "}
                  <strong>{quiz.questions.length} questions</strong>, and each
                  question is worth{" "}
                  <strong>{quiz.singleQuestionMarks} marks</strong>. The total
                  marks for the quiz are{" "}
                  <strong>{quiz.totalMarks} marks</strong>. Feel free to pace
                  yourself and give thoughtful answers.
                </li>
                <li>
                  Additionally, to successfully pass the quiz, you'll need to
                  achieve a minimum of{" "}
                  <strong>{quiz.passPercentage}% overall</strong>. Good luck,
                  and we hope you find the quiz both challenging and enjoyable!
                </li>
                {quiz.dueDate && (
                  <li>
                    Your due date is on{" "}
                    <strong
                      style={{
                        color: moment().isAfter(quiz.dueDate)
                          ? "tomato"
                          : "green",
                      }}
                    >
                      {moment(quiz.dueDate).format("MMM DD, YYYY - hh:mm A")}.
                    </strong>{" "}
                    Plan accordingly and feel free to reach out if you need any
                    assistance. Best of luck!
                  </li>
                )}
                <li>There is no negative marking.</li>
                <li>
                  You can go to any question in random by clicking on the
                  question number displayed on the left hand side.
                </li>
                <li>
                  <b>Mark for Review</b> - The question box will be marked as
                  RED and is used for revisiting the question, if required,
                  later during the exam.
                </li>
                <li>
                  At any point of time during the exam, you can go back to any
                  question and modify your choice(s) by clicking on the Previous
                  and the Next buttons or Select the question number from the
                  left side.
                </li>
                <li>
                  You can stop the Quiz by clicking on the "
                  <b>Finish Attempt</b>" button.
                </li>
                <li>Click the Attempt Quiz Now to start the exam.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {started && (
        <div>
          <StudentQuizStarted
            setStarted={setStarted}
            started={started}
            quiz={quiz}
          />
        </div>
      )}
    </div>
  ) : null;
};

export default StudentQuizStart;
