import { LoadingButton } from "@mui/lab";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  Tabs,
  Tab,
  CardContent,
  Checkbox,
  Divider,
  InputAdornment,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid,
  IconButton,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import TablePaginationActions from "@mui/material/TablePagination/TablePaginationActions";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BatchesContext } from "../../../services/Batches/Batches.context";
import _ from "lodash";
import { QuizContext } from "../../../services/Quiz/Quiz.context";
import { MdAssignmentAdd } from "react-icons/md";
import moment from "moment";
import { DateTimePicker } from "@mui/x-date-pickers";
import { EditorState } from "draft-js";
import { Editor } from "react-draft-wysiwyg";
import { convertFromHTML, convertToHTML } from "draft-convert";
import classes from "./Quiz.module.css";
import DeleteIcon from "@mui/icons-material/Delete";
import { FaQuestion } from "react-icons/fa";
import { showNotification } from "../../../shared/Notification/Notification";
import Swal from "sweetalert2";
import { scrollToTop } from "../../../utility/helper";
import SearchIcon from "@mui/icons-material/Search";
import { ElevatorSharp } from "@mui/icons-material";

const errors = {
  nameRequired: "Quiz name required",
  descriptionRequired: "Description required",
  questionsRequired: "There should be atleast one question to add quiz",
  totalMarksRequired: "Invalid Total Marks",
  singleQuestionMarksRequired:
    "Please select how many marks each question carries",
  passPercentageRequired: "Invalid Pass Percentage",
  availableFromRequired: "Please select quiz available from date",
  availableUntilRequired: "Please select quiz available until date",
  availableToRequired: "Please select quiz available to ",
  dueDateRequired: "Due Date Required",
  timeLimitRequired: "Please select Time Limit in minutes ",
  attemptsRequired: "Please select how many attempts ",
  dateMismatch: "Available Until cannot be before or equal From date",
  questionRequired: "Please enter question",
  questionTypeRequired: "Please select question type",
  batchRequired: "Please select Batch",
  studentsRequired: "Please select students to avail quiz",
  dueDateBeforeError: "Due Date cannot be before or same as available from",
  dueDateAfterError: "Due Date cannot be after available until",
};

const commonInputFieldProps = {
  value: "",
  focused: false,
  error: false,
  errorMessage: "",
};

const questionTypes = [
  {
    label: "Fill In The Blanks",
    value: "fill_in_the_blank",
  },
  {
    label: "Single Option",
    value: "single_option",
  },
  {
    label: "Multiple Options",
    value: "multiple_options",
  },
];

const defaultInputState = {
  name: {
    ...commonInputFieldProps,
  },
  description: {
    ...commonInputFieldProps,
  },
  totalMarks: {
    ...commonInputFieldProps,
  },
  singleQuestionMarks: {
    ...commonInputFieldProps,
  },
  availableFrom: {
    ...commonInputFieldProps,
    value: moment(),
  },
  availableUntil: {
    ...commonInputFieldProps,
    value: moment(),
  },
  dueDate: {
    ...commonInputFieldProps,
    value: null,
  },
  timeLimit: {
    ...commonInputFieldProps,
  },
  timeLimitEnabled: {
    ...commonInputFieldProps,
    value: true,
  },
  attempts: {
    ...commonInputFieldProps,
  },
  attemptsEnabled: {
    ...commonInputFieldProps,
    value: true,
  },
  passPercentage: {
    ...commonInputFieldProps,
  },
  availableToEveryone: {
    ...commonInputFieldProps,
    value: false,
  },

  id: {
    ...commonInputFieldProps,
  },
};

const defaultQuestionInput = {
  questionText: {
    ...commonInputFieldProps,
  },
  questionType: {
    ...commonInputFieldProps,
    value: questionTypes.find((q) => q.value === "single_option"),
  },

  optionText: {
    ...commonInputFieldProps,
  },

  selectedOption: {
    ...commonInputFieldProps,
  },

  selectedOptions: {
    ...commonInputFieldProps,
    value: [],
  },

  options: {
    ...commonInputFieldProps,
    value: [],
  },
};

const CreateEditQuiz = ({ mode }) => {
  const [quiz, setQuiz] = useState(null);
  const [inputs, setInputs] = useState(defaultInputState);
  const [loading, setLoading] = useState(false);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const { onGetBatches } = useContext(BatchesContext);
  const { onGetQuiz, onEditQuiz, onCreateQuiz, onGetQuizStudentsAndTrainers } =
    useContext(QuizContext);
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );
  const [searchKeyword, setSearchKeyword] = useState("");

  const [batches, setBatches] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(false);

  const [selectedBatches, setSelectedBatches] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [question, setQuestion] = useState(defaultQuestionInput);

  const navigate = useNavigate();
  let numRegex = /^\d+$/;

  const addQuestionRef = useRef(null);
  const questionRefs = useRef([]);
  const optionRef = useRef();

  useEffect(() => {
    let html = convertToHTML(editorState.getCurrentContent());
    setInputs((p) => ({
      ...p,
      description: {
        error: false,
        errorMessage: "",
        value: html,
      },
    }));
  }, [editorState]);

  useEffect(() => {
    if (!batchesLoading) {
      if (mode) {
        let title = mode === "edit" ? "Edit Quiz" : "Add New Quiz";
        document.title = title;
      }
      if (mode === "edit") {
        let editId = searchParams.get("id");
        if (!editId) {
          navigate("/dashboard/quiz");
          return;
        }
        if (editId) {
          onGetQuiz(
            editId,
            (result) => {
              let quizData = result.quiz;
              setQuiz(quizData);
            },
            () => {
              navigate("/dashboard/quiz");
            },
            true,
            false
          );
        }
      }
    }
  }, [mode, batchesLoading]);

  useEffect(() => {
    if (mode) {
      getBatches();
    }
  }, [mode]);

  useEffect(() => {
    onStructureData();
  }, [quiz]);

  const onStructureData = () => {
    if (!quiz) {
      return;
    }
    let {
      name,
      description,
      totalMarks,
      passPercentage,
      availableFrom,
      availableUntil,
      dueDate,
      availableToEveryone,
      singleQuestionMarks,
      timeLimit,
      attempts,
      attemptsEnabled,
      timeLimitEnabled,
      questions,
      batches: qBatches,
      _id,
    } = quiz;
    if (!availableToEveryone && qBatches?.length > 0) {
      let batchesFound = batches.filter((b) =>
        qBatches.some((cBatch) => cBatch._id === b._id)
      );
      setSelectedBatches(batchesFound);
    }

    let structeredQuestions = [];
    questions.forEach((question, i) => {
      let { questionText, questionType, options } = question;
      let obj = {
        ...defaultQuestionInput,
        questionText: {
          ...defaultQuestionInput.questionText,
          value: questionText,
        },
        questionType: {
          ...defaultQuestionInput.questionType,
          value: questionTypes.find((q) => q.value === questionType),
        },

        options: {
          value: {},
        },
      };
      let structuredOptions = [];
      let selectedOption = {
        ...commonInputFieldProps,
      };
      let selectedOptions = {
        ...commonInputFieldProps,
        value: [],
      };
      options.forEach((option) =>
        structuredOptions.push({
          optionText: option.optionText,
        })
      );
      if (questionType === "single_option") {
        let optionFound = options.find((option) => option.isCorrect);
        if (optionFound && optionFound.optionText) {
          selectedOption.value = optionFound.optionText;
        }
      }
      if (
        questionType === "multiple_options" ||
        questionType === "fill_in_the_blank"
      ) {
        let optionsFound = options.filter((option) => option.isCorrect);
        if (optionsFound && optionsFound.length > 0) {
          selectedOptions.value = optionsFound.map(
            (option) => option.optionText
          );
        }
      }

      obj.selectedOption = selectedOption;
      obj.selectedOptions = selectedOptions;
      obj.options.value = structuredOptions;
      structeredQuestions.push(obj);
    });
    setQuestions(structeredQuestions);

    let newEditorState = EditorState.createWithContent(
      convertFromHTML(description)
    );
    setEditorState(newEditorState);

    setInputs((prevState) => ({
      ...prevState,
      name: {
        ...commonInputFieldProps,
        value: name,
      },
      passPercentage: {
        ...commonInputFieldProps,
        value: passPercentage.toString(),
      },
      timeLimitEnabled: {
        ...commonInputFieldProps,
        value: timeLimitEnabled,
      },
      attemptsEnabled: {
        ...commonInputFieldProps,
        value: attemptsEnabled,
      },
      totalMarks: {
        ...commonInputFieldProps,
        value: totalMarks.toString(),
      },
      singleQuestionMarks: {
        ...commonInputFieldProps,
        value: singleQuestionMarks.toString(),
      },
      availableToEveryone: {
        ...commonInputFieldProps,
        value: availableToEveryone,
      },
      availableFrom: {
        ...commonInputFieldProps,
        value: moment(availableFrom),
      },
      dueDate: {
        ...commonInputFieldProps,
        value: dueDate ? moment(dueDate) : null,
      },
      availableUntil: {
        ...commonInputFieldProps,
        value: moment(availableUntil),
      },
      timeLimit: {
        ...commonInputFieldProps,
        value: timeLimit?.toString() || "",
      },
      attempts: {
        ...commonInputFieldProps,
        value: attempts?.toString() || "",
      },
      id: {
        value: _id,
      },
    }));
  };

  const getBatches = (query = "?dropDown=yes") => {
    onGetBatches(
      query,
      (result) => {
        setBatchesLoading(false);
        if (result && result.batches) {
          setBatches(result.batches);
        }
      },
      () => {
        setBatchesLoading(false);
      },
      true,
      false
    );
  };

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

  const onQuestionValueChangeHandler = (e) => {
    const { name, value } = e.target;
    setQuestion((prevState) => ({
      ...prevState,
      [name]: {
        ...prevState[name],
        error: false,
        errorMessage: "",
        value,
      },
    }));
  };

  const returnValue = (value) => {
    return typeof value === "string" ? value?.trim() : value;
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

    let {
      name,
      description,
      totalMarks,
      timeLimit,
      attempts,
      availableFrom,
      availableToEveryone,
      availableUntil,
      timeLimitEnabled,
      attemptsEnabled,
      singleQuestionMarks,
      passPercentage,
      dueDate,
      id,
    } = inputs;
    name = returnValue(name.value);
    description = returnValue(description.value);
    totalMarks = returnValue(totalMarks.value);
    singleQuestionMarks = returnValue(singleQuestionMarks.value);
    timeLimit = returnValue(timeLimit.value);
    attempts = returnValue(attempts.value);

    availableFrom = returnValue(availableFrom.value);
    availableUntil = returnValue(availableUntil.value);
    availableToEveryone = returnValue(availableToEveryone.value);
    timeLimitEnabled = returnValue(timeLimitEnabled.value);
    attemptsEnabled = returnValue(attemptsEnabled.value);

    passPercentage = returnValue(passPercentage.value);
    dueDate = returnValue(dueDate.value);
    id = returnValue(id.value);
    availableFrom = availableFrom?.valueOf();
    availableUntil = availableUntil?.valueOf();
    dueDate = dueDate?.valueOf();

    if (!name) {
      setErrorMessage("name", errors.nameRequired);
    }

    if (!singleQuestionMarks || !numRegex.test(singleQuestionMarks)) {
      setErrorMessage(
        "singleQuestionMarks",
        errors.singleQuestionMarksRequired
      );
    }

    if (!totalMarks || !numRegex.test(totalMarks)) {
      setErrorMessage("totalMarks", errors.totalMarksRequired);
    }

    let passingMarks = calculateScoreToPass()
      ? Number(calculateScoreToPass())
      : "";
    if (!passPercentage || !numRegex.test(passPercentage)) {
      setErrorMessage("passPercentage", errors.passPercentageRequired);
    } else if (!passingMarks || passingMarks > totalMarks) {
      setErrorMessage(
        "passPercentage",
        "Pass Percentage cannot exceed total marks"
      );
    }

    if ((!timeLimit || !numRegex.test(timeLimit)) && timeLimitEnabled) {
      setErrorMessage("timeLimit", errors.timeLimitRequired);
    }

    if ((!attempts || !numRegex.test(attempts)) && attemptsEnabled) {
      setErrorMessage("attempts", errors.attemptsRequired);
    }
    if (!availableFrom) {
      setErrorMessage("availableFrom", errors.availableFromRequired);
    }
    if (!availableUntil) {
      setErrorMessage("availableUntil", errors.availableUntil);
    }
    if (
      !availableToEveryone &&
      (!selectedBatches || selectedBatches.length === 0)
    ) {
      showNotification({ message: errors.studentsRequired, status: "error" });
      hadErrors = true;
    }

    if (availableFrom && availableUntil) {
      let availFrom = moment(availableFrom);
      let availUntil = moment(availableUntil);
      if (availUntil.isSameOrBefore(availFrom)) {
        setErrorMessage("availableUntil", errors.dateMismatch);
      }
    }

    if (availableUntil && dueDate) {
      let dueDt = moment(dueDate);
      let availFrom = moment(availableFrom);
      let availUntil = moment(availableUntil);

      if (dueDt.isSameOrBefore(availFrom)) {
        setErrorMessage("dueDate", errors.dueDateBeforeError);
      }
      if (dueDt.isAfter(availUntil)) {
        setErrorMessage("dueDate", errors.dueDateAfterError);
      }
    }

    if (!hadErrors && questions.length === 0) {
      showNotification({ message: errors.questionsRequired, status: "error" });
      hadErrors = true;
    }

    if (hadErrors) {
      return;
    }

    let data = {
      name: name,
      description: description === "<p></p>" ? "" : description,
      passPercentage: Number(passPercentage),
      timeLimitEnabled: timeLimitEnabled,
      attemptsEnabled: attemptsEnabled,
      batches: [],
      singleQuestionMarks: Number(singleQuestionMarks),
      totalMarks: Number(totalMarks),
      availableFrom: availableFrom,
      availableUntil: availableUntil,
      availableToEveryone: availableToEveryone,
    };

    if (timeLimitEnabled) {
      data.timeLimit = Number(timeLimit);
    } else {
      data.timeLimit = 0;
    }
    if (attemptsEnabled) {
      data.attempts = Number(attempts);
    } else {
      data.attempts = 0;
    }
    if (dueDate) {
      data.dueDate = dueDate;
    } else {
      data.dueDate = null;
    }

    let structeredQuestions = [];

    if (!availableToEveryone) {
      data.batches = selectedBatches.map((b) => b._id);
    }

    questions.forEach((question, i) => {
      let obj = {};
      let {
        questionText,
        questionType,
        selectedOption,
        options,
        selectedOptions,
      } = question;

      obj.questionText = questionText.value;
      obj.questionType = questionType.value?.value;
      let structeredOptions = [];
      options.value.forEach((option) => {
        let optionObj = {};
        let { optionText } = option;
        optionObj.optionText = optionText;
        optionObj.isCorrect =
          obj.questionType === "single_option"
            ? selectedOption.value === optionText
            : selectedOptions.value?.includes(optionText);
        structeredOptions.push(optionObj);
      });
      obj.options = structeredOptions;
      structeredQuestions.push(obj);
    });

    data.questions = structeredQuestions;

    if (mode === "edit") {
      onEditQuiz(id, data, (result) => {
        let { quiz } = result;
        if (quiz) {
          setQuiz(quiz);
        }
        // navigate(`/dashboard/quiz/edit?id=${id}&status=updated`);
        scrollToTop();
      });
    } else {
      onCreateQuiz(data, () => {
        navigate("/dashboard/quiz");
      });
    }
  };

  const onAddOption = () => {
    let optionText = question.optionText.value;
    if (!optionText) {
      setQuestion((prevState) => ({
        ...prevState,
        optionText: {
          ...prevState.optionText,
          error: true,
          errorMessage: "Please Enter Option",
        },
      }));
    } else {
      let currentOptions = question.options.value || [];
      let option = {
        optionText: optionText,
      };
      currentOptions.push(option);
      setQuestion((p) => ({
        ...p,
        optionText: {
          ...p.optionText,
          value: "",
        },
        options: {
          value: currentOptions,
        },
      }));
    }
    optionRef.current?.focus();
  };

  const onAddOrEditQuestion = () => {
    let {
      questionText,
      questionType,
      options,
      selectedOption,
      selectedOptions,
    } = question;
    questionText = returnValue(questionText.value);
    questionType = returnValue(questionType.value);
    options = returnValue(options.value);
    selectedOptions = returnValue(selectedOptions.value);
    // if fill in the blanks
    if (questionType.value === "fill_in_the_blank") {
      selectedOptions = options.map((option) => option.optionText);
      question.selectedOptions.value = selectedOptions;
    }

    let hadErrors = false;
    const setErrorMessage = (name, message) => {
      setQuestion((prevState) => ({
        ...prevState,
        [name]: {
          ...prevState[name],
          error: true,
          errorMessage: message,
        },
      }));
      hadErrors = true;
    };

    if (!questionText) {
      setErrorMessage("questionText", errors.questionRequired);
    }
    if (!questionType) {
      setErrorMessage("questionType", errors.questionTypeRequired);
    }

    if (!options || options.length === 0) {
      setErrorMessage("optionText", "Atleast one option required");
    } else {
      let optionErrors = false;
      options.map((option, i) => {
        let { optionText } = option;
        if (!optionText || !optionText.trim()) {
          option.error = true;
          option.errorMessage = "Please enter the options";
          optionErrors = true;
        }
      });
      if (optionErrors) {
        hadErrors = true;
        setQuestion((p) => ({
          ...p,
          options: {
            value: options,
          },
        }));
      }
    }
    if (
      !selectedOption?.value &&
      !hadErrors &&
      questionType.value === "single_option"
    ) {
      showNotification({
        message: "Please select correct answer",
        status: "error",
      });
      hadErrors = true;
    }
    if (
      selectedOptions?.length < 2 &&
      !hadErrors &&
      questionType.value === "multiple_options"
    ) {
      showNotification({
        message: "Please select more than one option",
        status: "error",
      });
      hadErrors = true;
    }
    if (
      selectedOptions?.length < 1 &&
      !hadErrors &&
      questionType.value === "fill_in_the_blank"
    ) {
      showNotification({
        message: "Please select atleast one option",
        status: "error",
      });
      hadErrors = true;
    }

    if (hadErrors) {
      return;
    }

    let currentQuestions = _.cloneDeep(questions);
    if (typeof selectedQuestion === "number") {
      currentQuestions[selectedQuestion] = question;
      questionRefs.current[selectedQuestion]?.scrollIntoView({
        behavior: "smooth",
      });
      setSelectedQuestion(null);
    } else {
      currentQuestions.push(question);
    }
    setQuestions(currentQuestions);

    setQuestion({
      ...defaultQuestionInput,
      options: {
        ...defaultQuestionInput.options,
        value: [],
      },
    });
  };

  const onClickDeleteOption = (index) => {
    let options = _.cloneDeep(question.options.value);
    let finalItems = options.filter((o, i) => i !== index);
    setQuestion((p) => ({
      ...p,
      selectedOption: {
        value: "",
      },
      selectedOptions: {
        value: [],
      },
      options: {
        value: finalItems,
      },
    }));
  };

  const onOptionValueChangeHandler = (index, value) => {
    let options = _.cloneDeep(question.options.value);
    let currentOption = _.get(options, index);
    currentOption.optionText = value;
    currentOption.error = false;
    currentOption.errorMessage = "";

    options[index] = currentOption;
    setQuestion((p) => ({
      ...p,
      selectedOption: {
        value: "",
      },
      selectedOptions: {
        value: [],
      },
      options: {
        value: options,
      },
    }));
  };

  const calculateScoreToPass = () => {
    let totalMarks = inputs.totalMarks.value;
    let passPercentage = inputs.passPercentage.value;
    if (totalMarks && passPercentage) {
      let passingMarks = Math.round((passPercentage / 100) * totalMarks);
      if (passingMarks > totalMarks) {
        return "";
      }
      return passingMarks.toString();
    }
    return "";
  };

  const onClickEditQuestion = (index) => {
    setSelectedQuestion(index);
    let currentQuestions = _.cloneDeep(questions);
    addQuestionRef?.current?.scrollIntoView({ behavior: "smooth" });
    setQuestion(currentQuestions[index]);
  };

  const onClickDeleteQuestion = (index) => {
    const onDeleteQuestion = () => {
      let currentQuestions = _.cloneDeep(questions);
      let finalItems = currentQuestions.filter((o, i) => i !== index);
      setQuestions(finalItems);
    };
    Swal.fire({
      title: "Are you sure to delete the question?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        onDeleteQuestion();
      }
    });
  };

  const fillInTheBlank = (question, answers) => {
    let filledQuestion = question;
    let index = 0;
    answers.forEach((answer) => {
      filledQuestion = filledQuestion.replace("#blank#", () => {
        index++;
        return answer ? `<u>${answer}</u>` : "<u>#blank#</u>";
      });
    });
    return filledQuestion;
  };

  const onChangeSelectBatch = (e, newValue) => {
    if (newValue.length === 0) {
      setSelectedBatches([]);
      return;
    }
    let uniqueValues = _.uniqBy(newValue, "_id");
    setSelectedBatches(uniqueValues);
  };

  useEffect(() => {
    let singleQuestionMark = inputs.singleQuestionMarks.value;
    if (
      questions &&
      questions.length > 0 &&
      numRegex.test(singleQuestionMark)
    ) {
      let totalMarks = Number(singleQuestionMark) * questions.length;
      totalMarks = totalMarks.toString();
      onValueChangeHandler({
        target: {
          name: "totalMarks",
          value: totalMarks,
        },
      });
    } else {
      onValueChangeHandler({
        target: {
          name: "totalMarks",
          value: "",
        },
      });
    }
  }, [inputs.singleQuestionMarks, questions]);

  return (
    <section>
      <Box
        component="form"
        noValidate
        // onSubmit={onSubmitForm.bind(this)}
        sx={{ mt: 2 }}
      >
        <Typography gutterBottom variant="h5" component="div">
          {mode === "create" ? "Add New Quiz " : "Edit Quiz"}
        </Typography>

        <LoadingButton
          type="button"
          onClick={onSubmitForm}
          loadingPosition="end"
          endIcon={<MdAssignmentAdd />}
          color="primary"
          loading={loading}
          loadingIndicator={"Adding..."}
          variant="contained"
          sx={{ display: "flex", ml: "auto" }}
        >
          {!loading && mode === "edit" ? "PROCEED & UPDATE" : "PROCEED & ADD"}
        </LoadingButton>

        <br />
        <Card>
          <CardContent>
            <Grid container spacing={2}>
              {/* name */}
              <Grid item md={12}>
                <TextField
                  error={inputs.name.error}
                  helperText={inputs.name.errorMessage}
                  margin="normal"
                  placeholder="Enter Quiz Name "
                  required
                  fullWidth
                  id="name"
                  label="Quiz Name"
                  name="name"
                  value={inputs.name.value}
                  onChange={onValueChangeHandler}
                />
              </Grid>

              {/* description */}
              <Grid item md={12}>
                <Editor
                  editorState={editorState}
                  onEditorStateChange={setEditorState}
                  wrapperClassName="wrapper-class"
                  editorClassName="editor-class"
                  toolbarClassName="toolbar-class"
                />
                {inputs.description.error && (
                  <FormHelperText error>
                    {inputs.description.errorMessage}
                  </FormHelperText>
                )}
              </Grid>

              {/* Single Question Marks */}
              <Grid item md={3}>
                <TextField
                  required
                  error={inputs.singleQuestionMarks.error}
                  helperText={inputs.singleQuestionMarks.errorMessage}
                  margin="normal"
                  fullWidth
                  id="singleQuestionMarks"
                  label="Each Question Marks?"
                  placeholder="Each Question Carries?"
                  name="singleQuestionMarks"
                  value={inputs.singleQuestionMarks.value}
                  onChange={onValueChangeHandler}
                />
              </Grid>

              {/* Total Marks */}
              <Grid item md={3}>
                <TextField
                  required
                  error={inputs.totalMarks.error}
                  helperText={inputs.totalMarks.errorMessage}
                  margin="normal"
                  fullWidth
                  id="totalMarks"
                  label="Total Marks"
                  placeholder="Enter Total Marks"
                  name="totalMarks"
                  disabled
                  value={inputs.totalMarks.value}
                  // onChange={onValueChangeHandler}
                />
              </Grid>

              {/* Pass Marks  */}
              <Grid item md={3}>
                <TextField
                  required
                  error={inputs.passPercentage.error}
                  helperText={inputs.passPercentage.errorMessage}
                  margin="normal"
                  fullWidth
                  id="passPercentage"
                  label="Pass Marks (Percentage)"
                  placeholder="Enter pass percentage"
                  name="passPercentage"
                  value={inputs.passPercentage.value}
                  onChange={onValueChangeHandler}
                />
              </Grid>

              {/* Final Score  */}
              <Grid item md={3}>
                <TextField
                  margin="normal"
                  fullWidth
                  disabled
                  label="Score To Pass"
                  value={calculateScoreToPass()}
                />
              </Grid>

              {/* available from  */}
              <Grid item md={4}>
                <br />
                <DateTimePicker
                  label="Available From"
                  format="DD-MM-YYYY hh:mm:ss A"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: inputs.availableFrom.error,
                      helperText: inputs.availableFrom.errorMessage,
                    },
                  }}
                  value={inputs.availableFrom.value}
                  onChange={(newValue) => {
                    onValueChangeHandler({
                      target: {
                        name: "availableFrom",
                        value: newValue,
                      },
                    });
                  }}
                />
              </Grid>

              {/* Available Until */}
              <Grid item md={4}>
                <br />
                <DateTimePicker
                  label="Available Until"
                  format="DD-MM-YYYY hh:mm:ss A"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: inputs.availableUntil.error,
                      helperText: inputs.availableUntil.errorMessage,
                    },
                  }}
                  value={inputs.availableUntil.value}
                  onChange={(newValue) => {
                    onValueChangeHandler({
                      target: {
                        name: "availableUntil",
                        value: newValue,
                      },
                    });
                  }}
                />
              </Grid>

              {/* Due Date */}
              <Grid item md={4}>
                <br />
                <DateTimePicker
                  label="Due Date"
                  format="DD-MM-YYYY hh:mm:ss A"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: inputs.dueDate.error,
                      helperText: inputs.dueDate.errorMessage,
                    },
                  }}
                  value={inputs.dueDate.value}
                  onChange={(newValue) => {
                    onValueChangeHandler({
                      target: {
                        name: "dueDate",
                        value: newValue,
                      },
                    });
                  }}
                />
              </Grid>

              {/* Time Limit enabled */}
              <Grid item md={6} sx={{ mt: 2 }}>
                <FormGroup>
                  <FormControlLabel
                    checked={inputs.timeLimitEnabled.value}
                    onChange={(e) => {
                      let value = !inputs.timeLimitEnabled.value;
                      onValueChangeHandler({
                        target: {
                          name: "timeLimitEnabled",
                          value: value,
                        },
                      });
                    }}
                    control={<Checkbox />}
                    label={`Enable Time Limit for Quiz`}
                  />
                </FormGroup>
              </Grid>

              {/* Time Limit */}
              {inputs.timeLimitEnabled.value && (
                <Grid item md={6}>
                  <TextField
                    required
                    error={inputs.timeLimit.error}
                    helperText={inputs.timeLimit.errorMessage}
                    margin="normal"
                    fullWidth
                    id="timeLimit"
                    label="Time Limit (in minutes)"
                    placeholder="Enter Time Limit in minutes"
                    name="timeLimit"
                    value={inputs.timeLimit.value}
                    onChange={onValueChangeHandler}
                  />
                </Grid>
              )}

              {/* Attempts enabled */}
              <Grid item md={6} sx={{ mt: 2 }}>
                <FormGroup>
                  <FormControlLabel
                    checked={inputs.attemptsEnabled.value}
                    onChange={(e) => {
                      let value = !inputs.attemptsEnabled.value;
                      onValueChangeHandler({
                        target: {
                          name: "attemptsEnabled",
                          value: value,
                        },
                      });
                    }}
                    control={<Checkbox />}
                    label={`Enable No Of Attempts for Quiz`}
                  />
                </FormGroup>
              </Grid>

              {/* Attempts */}
              {inputs.attemptsEnabled.value && (
                <Grid item md={6}>
                  <TextField
                    required
                    error={inputs.attempts.error}
                    helperText={inputs.attempts.errorMessage}
                    margin="normal"
                    fullWidth
                    id="attempts"
                    label="Attempts"
                    placeholder="Enter no of attempts"
                    name="attempts"
                    value={inputs.attempts.value}
                    onChange={onValueChangeHandler}
                  />
                </Grid>
              )}

              {/* avaialbe to everyone */}
              <Grid item md={6} sx={{ mt: 2 }}>
                <FormGroup>
                  <FormControlLabel
                    checked={inputs.availableToEveryone.value}
                    onChange={(e) => {
                      let value = !inputs.availableToEveryone.value;
                      if (!value) {
                        setSelectedBatches(null);
                      }
                      onValueChangeHandler({
                        target: {
                          name: "availableToEveryone",
                          value: value,
                        },
                      });
                    }}
                    control={<Checkbox />}
                    label={`Available To Everyone`}
                  />
                </FormGroup>
              </Grid>

              {/* select batches */}
              {!inputs.availableToEveryone.value && (
                <>
                  <Grid item md={6}>
                    <Autocomplete
                      disablePortal
                      id="batches"
                      className="mt-1"
                      options={batches}
                      multiple
                      fullWidth
                      value={selectedBatches || []}
                      onChange={(e, newValue) => {
                        onChangeSelectBatch(e, newValue);
                      }}
                      getOptionLabel={(option) =>
                        `${option.name} - ${option.code} `
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          required
                          label="Select Batches "
                        />
                      )}
                    />
                  </Grid>
                </>
              )}

              {/* submit button */}
            </Grid>
          </CardContent>
        </Card>
        <br />

        {/* display all questions */}
        {questions && questions.length > 0 && (
          <Card>
            <Typography variant="h5" sx={{ px: 2, mt: 3 }} component="div">
              Total Questions - {questions.length}
            </Typography>
            {questions.map((question, i) => {
              let {
                questionText,
                options,
                questionType,
                selectedOption,
                selectedOptions,
              } = question;
              let filledQuestion = "";
              if (questionType.value?.value === "fill_in_the_blank") {
                filledQuestion = fillInTheBlank(
                  questionText.value,
                  selectedOptions.value
                );
              }

              return (
                <React.Fragment key={i}>
                  <CardContent ref={(el) => (questionRefs.current[i] = el)}>
                    {/* disply question & options*/}
                    {questionText.value && (
                      <div className={classes.questionContainer}>
                        <div className={classes.questionFlex}>
                          <div className={classes.question}>
                            {questionType.value?.value !==
                              "fill_in_the_blank" && (
                              <>
                                {i + 1}. {questionText.value}
                              </>
                            )}
                            {questionType.value?.value ===
                              "fill_in_the_blank" && (
                              <p>
                                {i + 1}.{" "}
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: filledQuestion,
                                  }}
                                ></span>
                              </p>
                            )}
                          </div>
                          <div>
                            <IconButton
                              onClick={() => onClickEditQuestion(i)}
                              aria-label="edit"
                              color="info"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => onClickDeleteQuestion(i)}
                              aria-label="delete"
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>{" "}
                          </div>
                        </div>

                        <div className={classes.options}>
                          {questionType.value?.value === "single_option" && (
                            <FormControl>
                              <RadioGroup
                                name="radio-buttons-group"
                                value={selectedOption.value || null}
                              >
                                {options.value.map((item, i) => {
                                  let { optionText: ot } = item;
                                  return (
                                    <FormControlLabel
                                      key={i}
                                      value={ot}
                                      control={<Radio />}
                                      label={ot}
                                    />
                                  );
                                })}
                              </RadioGroup>
                            </FormControl>
                          )}

                          {questionType?.value?.value ===
                            "multiple_options" && (
                            <FormGroup>
                              {options.value.map((item, i) => {
                                let { optionText } = item;
                                return (
                                  <FormControlLabel
                                    key={i}
                                    checked={_.includes(
                                      selectedOptions.value,
                                      optionText
                                    )}
                                    value={optionText}
                                    control={<Checkbox />}
                                    label={optionText}
                                  />
                                );
                              })}
                            </FormGroup>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <Divider sx={{ mb: 0 }} />
                </React.Fragment>
              );
            })}
          </Card>
        )}

        {/* Add quesiton form */}
        <Card
          ref={addQuestionRef}
          sx={{
            mt: 2,
          }}
        >
          <CardContent>
            <Typography variant="h6">
              {typeof selectedQuestion === "number"
                ? `Edit Question No - ${selectedQuestion + 1}`
                : "Add Question"}{" "}
            </Typography>
            <br />
            {/* question and question type */}
            <Grid container spacing={2}>
              {/* Question */}
              <Grid item md={12}>
                <TextField
                  error={question.questionText.error}
                  helperText={question.questionText.errorMessage}
                  margin="normal"
                  placeholder="Enter Question "
                  required
                  fullWidth
                  multiline
                  id="questionText"
                  label="Question"
                  name="questionText"
                  value={question.questionText.value}
                  onChange={onQuestionValueChangeHandler}
                />
              </Grid>

              {/* question type */}
              <Grid item md={12}>
                <Autocomplete
                  disablePortal
                  id="questionType"
                  className="mt-1"
                  options={questionTypes}
                  fullWidth
                  value={question.questionType.value || null}
                  onChange={(e, newValue) => {
                    onQuestionValueChangeHandler({
                      target: {
                        name: "questionType",
                        value: newValue,
                      },
                    });
                  }}
                  getOptionLabel={(option) => `${option.label} `}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      helperText={question.questionType.errorMessage}
                      error={question.questionType.error}
                      label="Select Question Type "
                    />
                  )}
                />
              </Grid>
            </Grid>

            {/* select option block and preview*/}
            {question.questionText.value && (
              <div className={classes.questionContainer}>
                <div className={classes.question}>
                  {}
                  {question.questionType.value?.value ===
                    "fill_in_the_blank" && (
                    <p>
                      {typeof selectedQuestion === "number"
                        ? `${selectedQuestion + 1}. `
                        : `${questions.length + 1}.`}{" "}
                      <span
                        dangerouslySetInnerHTML={{
                          __html: fillInTheBlank(
                            question.questionText.value,
                            question.options.value.map(
                              (option) => option.optionText
                            )
                          ),
                        }}
                      ></span>
                    </p>
                  )}
                  {question.questionType.value?.value !==
                    "fill_in_the_blank" && (
                    <>
                      {typeof selectedQuestion === "number"
                        ? `${selectedQuestion + 1}. ${
                            question.questionText.value
                          }`
                        : `${questions.length + 1}. ${
                            question.questionText.value
                          }`}{" "}
                    </>
                  )}
                </div>
                <div className={classes.options}>
                  {question.questionType.value?.value ===
                    "multiple_options" && (
                    <FormGroup>
                      {question.options.value.map((item, i) => {
                        let { optionText } = item;
                        return (
                          <FormControlLabel
                            key={i}
                            checked={_.includes(
                              question.selectedOptions.value,
                              optionText
                            )}
                            value={optionText}
                            onChange={(e) => {
                              let value = e.target.value;
                              let selectedOptions = _.cloneDeep(
                                question.selectedOptions.value || []
                              );
                              let alreadyExists = selectedOptions.find(
                                (option) => option === value
                              );
                              if (alreadyExists) {
                                selectedOptions = selectedOptions.filter(
                                  (option) => option !== value
                                );
                              } else {
                                selectedOptions.push(value);
                              }
                              onQuestionValueChangeHandler({
                                target: {
                                  value: selectedOptions,
                                  name: "selectedOptions",
                                },
                              });
                            }}
                            control={<Checkbox />}
                            label={optionText}
                          />
                        );
                      })}
                    </FormGroup>
                  )}

                  {question.questionType.value?.value === "single_option" && (
                    <FormControl>
                      <RadioGroup
                        name="radio-buttons-group"
                        onChange={(e) =>
                          onQuestionValueChangeHandler({
                            target: {
                              value: e.target.value,
                              name: "selectedOption",
                            },
                          })
                        }
                        value={question.selectedOption.value || null}
                      >
                        {question.options.value.map((item, i) => {
                          let { optionText } = item;
                          return (
                            <FormControlLabel
                              key={i}
                              value={optionText}
                              control={<Radio />}
                              label={optionText}
                            />
                          );
                        })}
                      </RadioGroup>
                    </FormControl>
                  )}
                </div>
              </div>
            )}

            {/* options block */}
            {question.questionText.value && question.questionType.value && (
              <>
                {/* default add option */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  <Grid item md={8}>
                    <TextField
                      error={question.optionText.error}
                      helperText={question.optionText.errorMessage}
                      margin="normal"
                      placeholder="Enter Option "
                      required
                      inputRef={optionRef}
                      fullWidth
                      multiline
                      id="optionText"
                      label="Option"
                      variant="standard"
                      name="optionText"
                      value={question.optionText.value}
                      onChange={onQuestionValueChangeHandler}
                    />
                  </Grid>
                  <Grid item md={4}>
                    <Button
                      onClick={onAddOption}
                      fullWidth
                      variant="outlined"
                      sx={{
                        mt: 4,
                      }}
                    >
                      Add Option
                    </Button>
                  </Grid>
                </Grid>

                {/* options list */}
                {question.options.value &&
                  question.options.value.length > 0 && (
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                      {question.options.value.map((item, i) => {
                        let { optionText, error, errorMessage } = item;
                        return (
                          <React.Fragment key={i}>
                            <Grid item md={11} sm={11}>
                              <TextField
                                error={error}
                                helperText={errorMessage}
                                variant="standard"
                                margin="normal"
                                placeholder="Enter Option"
                                required
                                fullWidth
                                label={`Option ${i + 1}`}
                                value={optionText}
                                onChange={(e) =>
                                  onOptionValueChangeHandler(i, e.target.value)
                                }
                              />
                            </Grid>
                            <Grid item md={1} sm={1}>
                              <IconButton
                                sx={{ mt: 4 }}
                                onClick={() => onClickDeleteOption(i)}
                                aria-label="delete"
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>{" "}
                            </Grid>
                          </React.Fragment>
                        );
                      })}
                    </Grid>
                  )}
              </>
            )}

            <Divider sx={{ mb: 4 }} />
            <Button
              onClick={onAddOrEditQuestion}
              variant="contained"
              fullWidth
              endIcon={<FaQuestion size={15} />}
              color="info"
            >
              {typeof selectedQuestion === "number"
                ? "Update Question"
                : "Add Question"}
            </Button>
          </CardContent>
        </Card>
      </Box>
    </section>
  );
};

export default CreateEditQuiz;
