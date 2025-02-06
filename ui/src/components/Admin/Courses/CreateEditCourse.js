/* eslint-disable jsx-a11y/img-redundant-alt */
import { LoadingButton } from "@mui/lab";
import {
  Autocomplete,
  Box,
  Tabs,
  Tab,
  InputAdornment,
  Card,
  IconButton,
  CardContent,
  Grid,
  Checkbox,
  TextField,
  Typography,
  FormHelperText,
  Button,
  FormControlLabel,
  Divider,
  FormGroup,
  Switch,
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
} from "@mui/material";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TablePaginationActions from "@mui/material/TablePagination/TablePaginationActions";
import SearchIcon from "@mui/icons-material/Search";

import {
  MdDocumentScanner,
  MdEditDocument,
  MdImage,
  MdOndemandVideo,
  MdOutlineClose,
  MdPeople,
} from "react-icons/md";
import {
  convertFileToBase64,
  formatVideoDuration,
  getVideoDuration,
} from "../../../utility/helper";
import _ from "lodash";
import { CourseContext } from "../../../services/Courses/Courses.context";
import { EditorState } from "draft-js";
import { Editor } from "react-draft-wysiwyg";
import { convertFromHTML, convertToHTML } from "draft-convert";
import classes from "./Courses.module.css";
import { BatchesContext } from "../../../services/Batches/Batches.context";
import { showNotification } from "../../../shared/Notification/Notification";
import { TbNewSection } from "react-icons/tb";
import Swal from "sweetalert2";
import {
  FaCheck,
  FaCheckCircle,
  FaCloudUploadAlt,
  FaList,
  FaPlayCircle,
  FaRegPlayCircle,
  FaTrash,
} from "react-icons/fa";
import ReactModal from "react-modal";
import ReactPlayer from "react-player";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { FaPencil } from "react-icons/fa6";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { generatePresignedUrl } from "../../../utility/s3Helpers";
import { useDispatch } from "react-redux";
import { SocketContext } from "../../../services/Socket/Socket.context";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";

ReactModal.setAppElement("#root");

const errors = {
  titleRequired: "Course Title Required",
  headlineRequired: "Headline Required",
  descriptionRequired: "Description required",
  bannerImageRequired: "Banner Image required",
  batchRequired: "Please select Batch",
  studentsRequired: "Please select students to available course",
  availableToRequired: "Please select available to ",
  sectionTitleRequired: "Please enter section title",
};

const commonInputFieldProps = {
  value: "",
  focused: false,
  error: false,
  errorMessage: "",
};

const defaultInputState = {
  title: {
    ...commonInputFieldProps,
  },
  visible: {
    ...commonInputFieldProps,
    value: false,
  },
  courseId: {
    ...commonInputFieldProps,
  },
  totalDuration: {
    ...commonInputFieldProps,
  },
  totalLectures: {
    ...commonInputFieldProps,
  },
  headline: {
    ...commonInputFieldProps,
  },
  description: {
    ...commonInputFieldProps,
  },
  banner: {
    ...commonInputFieldProps,
  },
  availableToEveryone: {
    ...commonInputFieldProps,
    value: true,
  },

  id: {
    ...commonInputFieldProps,
  },
};

const defaultSectionInput = {
  title: {
    ...commonInputFieldProps,
  },
  resources: {
    ...commonInputFieldProps,
    value: [],
  },
  videos: {
    ...commonInputFieldProps,
    value: [],
  },
};

const CreateEditCourse = ({ mode }) => {
  const [course, setCourse] = useState(null);
  const [inputs, setInputs] = useState(defaultInputState);
  const [loading, setLoading] = useState(false);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    onCreateCourse,
    onGetCourse,
    onEditCourse,
    onRemoveCourseVideos,
    onRemoveCourseResources,
    onRemoveCourseSection,
  } = useContext(CourseContext);
  const { onFetchEvent, socket } = useContext(SocketContext);
  const { onGetBatches } = useContext(BatchesContext);

  const [selectedSection, setSelectedSection] = useState(false);
  const [batches, setBatches] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState(null);

  const [students, setStudents] = useState([]);

  const [sections, setSections] = useState([]);
  const [section, setSection] = useState(defaultSectionInput);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);

  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );

  const [videoProgress, setVideoProgress] = useState({});
  const [resourceProgress, setResourceProgress] = useState({});

  const [sectionAccordionOpen, setSectionAccordionOpen] = useState([]);

  const [resourceAccordionOpen, setResourceAccordionOpen] = useState([]);

  const [videosAccordionOpen, setVideosAccordionOpen] = useState([]);

  const [selectedVideosIndex, setSelectedVideosIndex] = useState([]);
  const [selectedResourcesIndex, setSelectedResourcesIndex] = useState([]);

  const [allVideosSelected, setAllVideosSelected] = useState(false);

  const [allResourcesSelected, setAllResourcesSelected] = useState(false);

  const addSectionRef = useRef();

  const sectionRefs = useRef([]);

  const videoUploadRef = useRef();
  const resourceUploadRef = useRef();

  const navigate = useNavigate();

  useEffect(() => {
    if (socket) {
      const eventHandler = (data) => {
        let { type, path, progress } = data;
        if (type === "video") {
          console.log("Video", path, progress);
          setVideoProgress((p) => ({
            ...p,
            [path]: progress,
          }));
        } else if (type === "resource") {
          console.log("resource", path, progress);
          setResourceProgress((p) => ({
            ...p,
            [path]: progress,
          }));
        }
      };
      onFetchEvent("courseFileUploadProgress", eventHandler);
      return () => {
        socket?.off("courseFileUploadProgress", eventHandler);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFetchEvent, socket]);

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
    const body = document.body;
    if (isModalOpen) {
      // Add the class to prevent body scroll
      body.style.overflow = "hidden";
    } else {
      // Remove the class to allow body scroll
      body.style.overflow = "auto";
    }
  }, [isModalOpen]);

  useEffect(() => {
    // getServiceCenters();
    if (!batchesLoading) {
      if (mode) {
        let title = mode === "edit" ? "Edit Course" : "Add New Course";
        document.title = title;
      }
      if (mode === "edit") {
        let editId = searchParams.get("id");
        if (!editId) {
          navigate("/dashboard/courses");
          return;
        }
        if (editId) {
          onGetCourse(
            editId,
            (result) => {
              let courseData = result.course;
              if (courseData) {
                setCourse(courseData);
              } else {
                navigate("/dashboard/courses");
              }
            },
            () => {
              navigate("/dashboard/courses");
            },
            true,
            false
          );
        }
      }
    }
  }, [mode, batchesLoading]);

  useEffect(() => {
    if (course) {
      onStructureData();
    }
  }, [course]);

  useEffect(() => {
    if (mode) {
      getBatches();
    }
  }, [mode]);

  useEffect(() => {
    if (
      selectedVideosIndex &&
      selectedVideosIndex.length > 0 &&
      section?.videos?.value &&
      section.videos.value.length === selectedVideosIndex.length
    ) {
      setAllVideosSelected(true);
    } else {
      setAllVideosSelected(false);
    }
  }, [selectedVideosIndex]);

  useEffect(() => {
    if (
      selectedResourcesIndex &&
      selectedResourcesIndex.length > 0 &&
      section?.resources?.value &&
      section.resources.value.length === selectedResourcesIndex.length
    ) {
      setAllResourcesSelected(true);
    } else {
      setAllResourcesSelected(false);
    }
  }, [selectedResourcesIndex]);

  const onResetValues = () => {
    setVideoProgress({});
    setResourceProgress({});
    setSelectedVideosIndex([]);
    setSelectedResourcesIndex([]);
    setAllVideosSelected(false);
    setAllResourcesSelected(false);
    setSection(defaultSectionInput);
    setSelectedSection(false);
    setSelectedBatches(null);
  };

  const onStructureData = async () => {
    if (!course) {
      return;
    }
    onResetValues();
    let {
      title,
      courseId,
      visible,
      headline,
      content,
      description,
      totalDuration,
      totalLectures,
      availableToEveryone,
      banner,
      batches: cBatches,
      _id,
    } = course;
    let bannerUrl = await generatePresignedUrl(banner);
    if (!availableToEveryone && cBatches?.length > 0) {
      let batchesFound = batches.filter((b) =>
        cBatches.some((cBatch) => cBatch._id === b._id)
      );
      setSelectedBatches(batchesFound);
    }

    let newEditorState = EditorState.createWithContent(
      convertFromHTML(description)
    );
    setEditorState(newEditorState);

    let structuredSections = [];

    content.sections.forEach((s) => {
      let { title: sectionTitle, videos, sectionId, resources } = s;
      let obj = {
        title: {
          ...commonInputFieldProps,
          value: sectionTitle,
        },
        sectionId: {
          ...commonInputFieldProps,
          value: sectionId || "",
        },
        videos: {
          ...commonInputFieldProps,
          value: [],
        },
        resources: {
          ...commonInputFieldProps,
          value: [],
        },
      };

      if (resources?.length > 0) {
        resources.forEach((r) => {
          let { title: resourceTitle, path } = r;
          let resourceObj = {
            title: {
              ...commonInputFieldProps,
              value: resourceTitle,
            },
            url: {
              ...commonInputFieldProps,
              value: path,
            },
          };
          obj.resources.value.push(resourceObj);
        });
      }

      videos.forEach((v) => {
        let { title: videoTitle, duration, path } = v;
        let videoObj = {
          title: {
            ...commonInputFieldProps,
            value: videoTitle,
          },
          duration: duration,
          url: {
            ...commonInputFieldProps,
            value: path,
          },
        };
        obj.videos.value.push(videoObj);
      });

      structuredSections.push(obj);
    });

    setSections(structuredSections);
    setInputs((prevState) => ({
      ...prevState,
      title: {
        ...commonInputFieldProps,
        value: title,
      },
      visible: {
        ...commonInputFieldProps,
        value: visible || false,
      },
      courseId: {
        ...commonInputFieldProps,
        value: courseId,
      },
      banner: {
        ...commonInputFieldProps,
        value: banner,
        preview: bannerUrl,
      },
      totalDuration: {
        ...commonInputFieldProps,
        value: totalDuration,
      },
      totalLectures: {
        ...commonInputFieldProps,
        value: totalLectures,
      },
      headline: {
        ...commonInputFieldProps,
        value: headline,
      },
      availableToEveryone: {
        ...commonInputFieldProps,
        value: availableToEveryone,
      },

      id: {
        value: _id,
      },
    }));
  };

  const getBatches = (query = "?dropdown=yes") => {
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
      false,
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

  const onSectionValueChangeHandler = (e) => {
    const { name, value } = e.target;
    setSection((prevState) => ({
      ...prevState,
      [name]: {
        ...prevState[name],
        error: false,
        errorMessage: "",
        value,
      },
    }));
  };

  const onSectionVideoValueChangeHandler = (e, index) => {
    const { name, value } = e.target;
    let currentVideos = _.cloneDeep(section.videos.value);
    let currentVideo = currentVideos[index];
    currentVideo[name].value = value;
    currentVideo[name].error = false;
    currentVideo[name].errorMessage = "";
    setSection((prevState) => ({
      ...prevState,
      videos: {
        ...prevState.videos,
        value: currentVideos,
      },
    }));
  };

  const onSectionResourceValueChangeHandler = (e, index) => {
    const { name, value } = e.target;
    let currentResources = _.cloneDeep(section.resources.value);
    let currentResource = currentResources[index];
    currentResource[name].value = value;
    currentResource[name].error = false;
    currentResource[name].errorMessage = "";
    setSection((prevState) => ({
      ...prevState,
      resources: {
        ...prevState.resources,
        value: currentResources,
      },
    }));
  };

  const returnValue = (value) => {
    return typeof value === "string" ? value?.trim() : value;
  };

  const onAddOrEditSection = () => {
    let { title, videos, resources } = section;
    title = returnValue(title.value);
    videos = returnValue(videos.value);
    resources = returnValue(resources.value);
    let hadErrors = false;
    const setErrorMessage = (name, message) => {
      setSection((prevState) => ({
        ...prevState,
        [name]: {
          ...prevState[name],
          error: true,
          errorMessage: message,
        },
      }));
      hadErrors = true;
    };

    if (!title) {
      setErrorMessage("title", errors.sectionTitleRequired);
    }

    if ((!videos || videos.length === 0) && !hadErrors) {
      setErrorMessage("title", "Please upload atleast one video");
    }

    if (hadErrors) {
      return;
    }

    let videoErrors = false;
    let resourceErrors = false;
    videos.forEach((v, i) => {
      let { title, video } = v;
      if (!title.value) {
        title.error = true;
        title.errorMessage = "Video Title Required";
        videoErrors = true;
      }
    });

    if (resources.length > 0) {
      resources.forEach((r, i) => {
        let { title, resource } = r;
        if (!title.value) {
          title.error = true;
          title.errorMessage = "Resource Title Required";
          resourceErrors = true;
        }
      });
    }

    if (resourceErrors) {
      setSection((p) => ({
        ...p,
        resources: {
          ...p.resources,
          value: resources,
        },
      }));
      return;
    }

    if (videoErrors) {
      setSection((p) => ({
        ...p,
        videos: {
          ...p.videos,
          value: videos,
        },
      }));
      return;
    }

    let currentSections = _.cloneDeep(sections);
    if (typeof selectedSection === "number") {
      currentSections[selectedSection] = section;
      sectionRefs.current[selectedSection]?.scrollIntoView({
        behavior: "smooth",
      });
      setSelectedSection(null);
    } else {
      currentSections.push(section);
    }

    setSections(currentSections);

    setSection({
      ...defaultSectionInput,
    });
    videoUploadRef.current.value = "";
    resourceUploadRef.current.value = "";
  };

  const onRemoveVideoFromSection = () => {
    Swal.fire({
      title: "Are you sure to remove the videos?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove it!",
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }
      let currentVideos = _.cloneDeep(section.videos.value);

      const removeVideo = () => {
        currentVideos = currentVideos.filter(
          (v, i) => !selectedVideosIndex.includes(i)
        );
        setSection((p) => ({
          ...p,
          videos: {
            ...p.videos,
            value: currentVideos,
          },
        }));
        setSelectedVideosIndex([]);
      };
      if (mode === "edit") {
        const videosToRemoveFromBackend = [];
        const videosToRemoveIndexes = [];
        selectedVideosIndex.map((index) => {
          const video = currentVideos[index];
          if (video?.video?.value) {
            videosToRemoveIndexes.push(index);
          } else {
            videosToRemoveFromBackend.push(video.url.value);
          }
        });
        if (videosToRemoveFromBackend.length > 0) {
          let data = {
            videos: videosToRemoveFromBackend,
          };
          onRemoveCourseVideos(inputs.id.value, data, (result) => {
            let courseData = result.course;
            setCourse(courseData);
          });
        } else {
          removeVideo();
        }
      } else {
        removeVideo();
      }
    });
  };

  const onRemoveSection = (section) => {
    if (mode !== "edit") {
      return;
    }
    Swal.fire({
      title: "Are you sure to remove the section completely?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove it!",
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }
      let data = {
        sectionId: section.sectionId.value,
      };
      onRemoveCourseSection(inputs.id.value, data, (result) => {
        let courseData = result.course;
        setCourse(courseData);
      });
    });
  };

  const onRemoveResourceFromSection = () => {
    Swal.fire({
      title: "Are you sure to remove the resources?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove it!",
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }
      let currentResources = _.cloneDeep(section.resources.value);

      const removeResource = () => {
        currentResources = currentResources.filter(
          (v, i) => !selectedResourcesIndex.includes(i)
        );
        setSection((p) => ({
          ...p,
          resources: {
            ...p.videos,
            value: currentResources,
          },
        }));
        setSelectedResourcesIndex([]);
      };
      if (mode === "edit") {
        const resourcesToRemoveFromBackend = [];
        const resourcesToRemoveIndexes = [];
        selectedResourcesIndex.map((index) => {
          const resource = currentResources[index];
          if (resource?.resource?.value) {
            resourcesToRemoveIndexes.push(index);
          } else {
            resourcesToRemoveFromBackend.push(resource.url.value);
          }
        });
        if (resourcesToRemoveFromBackend.length > 0) {
          let data = {
            resources: resourcesToRemoveFromBackend,
          };
          onRemoveCourseResources(inputs.id.value, data, (result) => {
            let courseData = result.course;
            setCourse(courseData);
          });
        } else {
          removeResource();
        }
      } else {
        removeResource();
      }
    });
  };

  const handleBannerChange = async (e) => {
    const selectedFile = e.target.files[0];
    let base64 = await convertFileToBase64(selectedFile);
    setInputs((p) => ({
      ...p,
      banner: {
        file: selectedFile,
        value: base64,
        preview: base64,
        error: false,
        errorMessage: "",
      },
    }));
  };

  const handleVideoChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    // let base64 = await convertFileToBase64(selectedFile);
    let videos = _.cloneDeep(section.videos.value || []);
    for (const file of selectedFiles) {
      let filename = file.name;
      let videoExists = videos.find((v) => v.video?.value?.name === filename);
      if (!videoExists) {
        let url = URL.createObjectURL(file);
        let duration = await getVideoDuration(url);
        let obj = {
          title: {
            ...commonInputFieldProps,
          },
          video: {
            ...commonInputFieldProps,
            value: file,
          },
          url: {
            ...commonInputFieldProps,
            value: url,
          },
          duration: duration,
        };
        videos.push(obj);
      }
    }
    setSection((p) => ({
      ...p,
      title: {
        ...p.title,
        error: false,
        errorMessage: "",
      },
      videos: {
        value: videos,
        error: false,
        errorMessage: "",
      },
    }));

    videoUploadRef.current.value = "";
  };

  const handleResourceChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    // let base64 = await convertFileToBase64(selectedFile);
    let resources = _.cloneDeep(section.resources.value || []);
    for (const file of selectedFiles) {
      let filename = file.name;
      let resourceExists = resources.find(
        (r) => r.resouce?.value?.name === filename
      );
      if (!resourceExists) {
        let url = URL.createObjectURL(file);
        let obj = {
          title: {
            ...commonInputFieldProps,
          },
          resource: {
            ...commonInputFieldProps,
            value: file,
          },
          url: {
            ...commonInputFieldProps,
            value: url,
          },
        };
        resources.push(obj);
      }
    }
    setSection((p) => ({
      ...p,
      title: {
        ...p.title,
        error: false,
        errorMessage: "",
      },
      resources: {
        value: resources,
        error: false,
        errorMessage: "",
      },
    }));
    resourceUploadRef.current.value = "";
  };

  const handlePlayVideo = async (url, duration) => {
    if (mode === "edit") {
      if (url.startsWith("blob:")) {
        setVideoUrl(url);
        setIsModalOpen(true);
        return;
      }
      let previewUrl = await generatePresignedUrl(url, duration);
      setVideoUrl(previewUrl);
      setIsModalOpen(true);
    } else {
      setVideoUrl(url);
      setIsModalOpen(true);
    }
  };

  const handleOpenResource = async (url, duration) => {
    if (mode === "edit") {
      if (url.startsWith("blob:")) {
        window.open(url, "__blank");
        return;
      }
      let previewUrl = await generatePresignedUrl(url);
      window.open(previewUrl, "__blank");
    } else {
      window.open(url, "__blank");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setVideoUrl(null);
  };

  const onClickEditSection = (index) => {
    setSelectedSection(index);
    let currentSections = _.cloneDeep(sections);
    addSectionRef?.current?.scrollIntoView({ behavior: "smooth" });
    setSection(currentSections[index]);
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

    let { title, headline, description, availableToEveryone, banner, visible } =
      inputs;
    title = returnValue(title.value);
    headline = returnValue(headline.value);
    description = returnValue(description.value);
    availableToEveryone = returnValue(availableToEveryone.value);
    banner = returnValue(banner.file);

    let currentSections = _.cloneDeep(sections);

    if (!title) {
      setErrorMessage("title", errors.titleRequired);
    }

    if (!headline) {
      setErrorMessage("headline", errors.headlineRequired);
    }

    if (!banner && mode !== "edit") {
      setErrorMessage("banner", errors.bannerImageRequired);
    }

    if (!currentSections || currentSections.length === 0) {
      showNotification({
        message: "Please add atlease one section to continue",
        status: "error",
      });
      hadErrors = true;
    }

    if (
      !availableToEveryone &&
      (!selectedBatches || selectedBatches.length === 0)
    ) {
      showNotification({ message: errors.studentsRequired, status: "error" });
      hadErrors = true;
    }

    if (hadErrors) {
      return;
    }
    let formData = new FormData();

    let data = {
      title: title,
      headline: headline,
      description: description === "<p></p>" ? "" : description,
      batches: [],
      visible: visible.value || false,
      availableToEveryone: availableToEveryone,
      content: {
        sections: [],
      },
    };

    if (!availableToEveryone) {
      data.batches = selectedBatches.map((b) => b._id);
    }

    let structuredSections = [];

    currentSections.forEach((s, i) => {
      let { title, videos, resources, sectionId } = s;
      let obj = {
        title: title.value.trim(),
        sectionId: sectionId?.value,
        videos: [],
        resources: [],
      };
      if (resources.value.length > 0) {
        resources.value.forEach((r, ri) => {
          let { title, resource, url } = r;
          let resourceObj = {
            title: title.value,
          };
          // send resources
          if (resource?.value) {
            formData.append(
              "resources",
              resource.value,
              `resource_section${i}_resource${ri}`
            );
          } else {
            resourceObj.path = url.value;
          }
          obj.resources.push(resourceObj);
        });
      }
      videos.value.forEach((v, vi) => {
        let { title, video, duration, url } = v;
        let videoObj = {
          title: title.value,
          duration: duration,
        };
        // send videos
        if (video?.value) {
          formData.append(
            "videos",
            video.value,
            `video_section${i}_video${vi}`
          );
        } else {
          videoObj.path = url.value;
        }
        obj.videos.push(videoObj);
      });

      structuredSections.push(obj);
    });

    data.content.sections = structuredSections;

    if (banner) {
      formData.append("banner", banner);
    } else {
      data.banner = inputs.banner.value;
    }

    formData.append("data", JSON.stringify(data));

    if (mode === "edit") {
      onEditCourse(inputs.id.value, formData, (result) => {
        if (result.course) {
          setCourse(result.course);
        }
      });
    } else {
      onCreateCourse(formData, () => {
        navigate("/dashboard/courses");
      });
    }
  };

  const onVideoReorder = (fromIndex, toIndex) => {
    let currentVideos = _.cloneDeep(section.videos.value);
    if (currentVideos?.length > 0) {
      let [reorderedItem] = currentVideos.splice(fromIndex, 1);
      currentVideos.splice(toIndex, 0, reorderedItem);
      setSection((p) => ({
        ...p,
        videos: {
          ...p.videos,
          value: currentVideos,
        },
      }));
    }
  };

  const onResourceReorder = (fromIndex, toIndex) => {
    let currentResources = _.cloneDeep(section.resources.value);
    if (currentResources?.length > 0) {
      let [reorderedItem] = currentResources.splice(fromIndex, 1);
      currentResources.splice(toIndex, 0, reorderedItem);
      setSection((p) => ({
        ...p,
        resources: {
          ...p.resources,
          value: currentResources,
        },
      }));
    }
  };

  const onSectionReorder = (fromIndex, toIndex) => {
    let currentSections = _.cloneDeep(sections);
    if (currentSections?.length > 0) {
      let [reorderedItem] = currentSections.splice(fromIndex, 1);
      currentSections.splice(toIndex, 0, reorderedItem);
      setSections(currentSections);
    }
  };

  const handleOnDragEnd = (result) => {
    if (!result.destination || !result.source) {
      return;
    }
    let { droppableId, index } = result?.destination;
    let fromIndex = result?.source.index;
    let toIndex = index;
    setSelectedVideosIndex([]);
    if (droppableId === "videos") {
      onVideoReorder(fromIndex, toIndex);
    } else if (droppableId === "sections") {
      onSectionReorder(fromIndex, toIndex);
    } else if (droppableId === "resources") {
      onResourceReorder(fromIndex, toIndex);
    }
  };

  const onClearSection = () => {
    // skip if in edit mode
    // if (typeof selectedSection === "number") {
    //   return;
    // }
    Swal.fire({
      title: "Are you sure want to clear the section?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove it!",
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }
      setSection(defaultSectionInput);
    });
  };

  const onExpandSectionAccordion = (index) => {
    let currentState = _.cloneDeep(sectionAccordionOpen);
    currentState[index] = !currentState[index];
    setSectionAccordionOpen(currentState);
  };

  const onExpandResourceAccordion = (index) => {
    let currentState = _.cloneDeep(resourceAccordionOpen);
    currentState[index] = !currentState[index];
    setResourceAccordionOpen(currentState);
  };

  const onExpandVideosAccordion = (index) => {
    let currentState = _.cloneDeep(videosAccordionOpen);
    currentState[index] = !currentState[index];
    setVideosAccordionOpen(currentState);
  };

  const onChangeSelectedVideoIndex = (index) => {
    let currentSelectedVideosIndex = _.cloneDeep(selectedVideosIndex);
    let indexExists = currentSelectedVideosIndex.includes(index);
    if (indexExists) {
      currentSelectedVideosIndex = currentSelectedVideosIndex.filter(
        (i) => i !== index
      );
    } else {
      currentSelectedVideosIndex.push(index);
    }
    setSelectedVideosIndex(currentSelectedVideosIndex);
  };

  const onChangeSelectedResourceIndex = (index) => {
    let currentSelectedResoucesIndex = _.cloneDeep(selectedResourcesIndex);
    let indexExists = currentSelectedResoucesIndex.includes(index);
    if (indexExists) {
      currentSelectedResoucesIndex = currentSelectedResoucesIndex.filter(
        (i) => i !== index
      );
    } else {
      currentSelectedResoucesIndex.push(index);
    }
    setSelectedResourcesIndex(currentSelectedResoucesIndex);
  };

  const onSelectAllVideos = () => {
    let checked = !allVideosSelected;
    if (checked) {
      let videosLength = section.videos.value.length;
      let finalArray = _.range(videosLength);
      setSelectedVideosIndex(finalArray);
    } else {
      setSelectedVideosIndex([]);
    }
  };

  const onSelecteAllResources = () => {
    let checked = !allResourcesSelected;
    if (checked) {
      let resourcesLength = section.resources.value.length;
      let finalArray = _.range(resourcesLength);
      setSelectedResourcesIndex(finalArray);
    } else {
      setSelectedResourcesIndex([]);
    }
  };

  const onChangeSelectBatch = (e, newValue) => {
    if (newValue.length === 0) {
      setSelectedBatches([]);
      return;
    }
    let uniqueValues = _.uniqBy(newValue, "_id");
    setSelectedBatches(uniqueValues);
  };

  return (
    <DragDropContext onDragEnd={handleOnDragEnd}>
      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 3,
            }}
          >
            {mode === "create" && (
              <Typography gutterBottom variant="h5" component="div">
                Add New Course
              </Typography>
            )}
            {mode === "edit" && (
              <Box>
                <Typography gutterBottom variant="h6" component="div">
                  {`${inputs.title.value} - ${(
                    inputs.totalDuration.value / 3600
                  ).toFixed(2)} total hours - ${
                    inputs.totalLectures.value
                  } total lectures`}
                </Typography>
                <p>
                  Course Id :{" "}
                  <strong>{_.toUpper(inputs.courseId.value)}</strong>
                </p>
              </Box>
            )}

            <div>
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                id="bannerImage"
                style={{ display: "none" }}
                onChange={handleBannerChange}
              />
              <label htmlFor="bannerImage">
                <Button
                  component="span"
                  fullWidth
                  variant="contained"
                  color="info"
                  startIcon={<MdImage />}
                >
                  {inputs.banner.value
                    ? "Change Banner Image"
                    : "Add Banner Image"}
                </Button>
              </label>
              {inputs.banner.error && (
                <FormHelperText error>
                  {inputs.banner.errorMessage}
                </FormHelperText>
              )}
            </div>
          </Box>

          <Box
            component="form"
            noValidate
            onSubmit={onSubmitForm.bind(this)}
            sx={{ mt: 2 }}
          >
            <Grid container spacing={2}>
              {/* for form */}

              {/* banner image */}

              <Grid item md={12}>
                {inputs.banner.value && (
                  <img
                    src={
                      mode === "edit"
                        ? inputs.banner.preview
                        : inputs.banner.value
                    }
                    alt="banner image"
                    className={classes.bannerImage}
                  />
                )}
              </Grid>

              {/*title name */}
              <Grid item md={6}>
                <TextField
                  error={inputs.title.error}
                  helperText={inputs.title.errorMessage}
                  margin="normal"
                  placeholder="Ex: Java Programming"
                  required
                  fullWidth
                  id="title"
                  label="Course Title"
                  name="title"
                  value={inputs.title.value}
                  onChange={onValueChangeHandler}
                />
              </Grid>

              {/*Headline */}
              <Grid item md={6}>
                <TextField
                  error={inputs.headline.error}
                  helperText={inputs.headline.errorMessage}
                  margin="normal"
                  placeholder="Ex:Acquire Key Java Skills: From Basics to Advanced Programming &amp; Certification - Start Your Dev Career"
                  required
                  fullWidth
                  id="title"
                  label="Headline"
                  name="headline"
                  value={inputs.headline.value}
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

              <Grid item md={6} sx={{ mt: 2 }}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={inputs.visible.value}
                        onChange={() => {
                          onValueChangeHandler({
                            target: {
                              name: "visible",
                              value: !inputs.visible.value,
                            },
                          });
                        }}
                        name="visibility"
                      />
                    }
                    label="Mark as visible"
                  />
                </FormGroup>
              </Grid>

              {/* submit button */}

              <LoadingButton
                type="submit"
                fullWidth
                loadingPosition="end"
                endIcon={<MdPeople />}
                color="primary"
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
        </CardContent>
      </Card>

      {sections && sections.length > 0 && (
        <Droppable droppableId="sections">
          {(provided) => (
            <Box
              className="sections"
              ref={provided.innerRef}
              {...provided.droppableProps}
              sx={{ mt: 3 }}
            >
              {sections.map((s, i) => {
                let { title, videos, sectionId, resources } = s;
                title = returnValue(title.value);
                videos = returnValue(videos.value);
                resources = returnValue(resources.value);

                let id = `section-${i}`;
                sectionId = sectionId?.value
                  ? ` - (${_.toUpper(sectionId.value)})`
                  : "";
                return (
                  <Draggable key={id} draggableId={id} index={i}>
                    {(provided) => (
                      <Box ref={provided.innerRef} {...provided.draggableProps}>
                        <Accordion
                          defaultExpanded={false}
                          expanded={sectionAccordionOpen[i] || false}
                          ref={(el) => (sectionRefs.current[i] = el)}
                        >
                          <AccordionSummary
                            expandIcon={
                              <ExpandMoreIcon
                                onClick={() => {
                                  onExpandSectionAccordion(i);
                                }}
                              />
                            }
                            aria-controls="panel1-content"
                            id="panel1-header"
                          >
                            <Box
                              sx={{
                                width: "95%",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <h3>
                                Section {i + 1}: {title} {sectionId}
                              </h3>
                              <div className={classes.sectionActionContainer}>
                                <div
                                  className={classes.editButton}
                                  onClick={() => onClickEditSection(i)}
                                >
                                  <FaPencil size={15} />
                                </div>
                                {mode && mode === "edit" && (
                                  <div
                                    onClick={() => onRemoveSection(s)}
                                    className={classes.deleteButton}
                                  >
                                    <FaTrash size={15} />
                                  </div>
                                )}

                                <div
                                  className={classes.reOrderButton}
                                  {...provided.dragHandleProps}
                                >
                                  <FaList size={15} />
                                </div>
                              </div>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            {/* resources accordion */}
                            <Accordion
                              defaultExpanded={false}
                              style={{
                                boxShadow: "none",
                              }}
                              expanded={resourceAccordionOpen[i] || false}
                            >
                              <AccordionSummary
                                expandIcon={
                                  <ExpandMoreIcon
                                    onClick={() => {
                                      onExpandResourceAccordion(i);
                                    }}
                                  />
                                }
                                aria-controls={`${i}_resource`}
                                id={`${i}_resource`}
                              >
                                <p>Resources - {resources.length || 0}</p>
                              </AccordionSummary>
                              <AccordionDetails>
                                {resources && resources.length > 0 && (
                                  <Grid container spacing={3}>
                                    {resources.map((r, i) => {
                                      let { title, url } = r;
                                      const progress =
                                        resourceProgress[url.value];
                                      return (
                                        <React.Fragment key={i}>
                                          {/* video title */}
                                          <Grid item md={6}>
                                            <p>
                                              {i + 1}. {title.value}
                                            </p>
                                          </Grid>

                                          {/* actions */}
                                          <Grid
                                            item
                                            md={4}
                                            sx={{
                                              display: "flex",
                                              justifyContent: "center",
                                              alignItems: "center",
                                              gap: 1.5,
                                            }}
                                          >
                                            <MdDocumentScanner
                                              className="cp"
                                              onClick={() =>
                                                handleOpenResource(url.value)
                                              }
                                              size={25}
                                              color="orange"
                                            />
                                          </Grid>

                                          {typeof progress === "number" && (
                                            <Grid item md={2} mt={1}>
                                              <Box width={50}>
                                                <CircularProgressbar
                                                  styles={buildStyles({
                                                    pathColor: "#4BAF40",
                                                    textColor: "#4BAF40",
                                                  })}
                                                  value={progress}
                                                  text={`${progress}%`}
                                                />
                                              </Box>
                                            </Grid>
                                          )}
                                        </React.Fragment>
                                      );
                                    })}
                                  </Grid>
                                )}
                              </AccordionDetails>
                            </Accordion>
                            {/* videos accordion */}
                            <Accordion
                              defaultExpanded={false}
                              style={{
                                boxShadow: "none",
                              }}
                              expanded={videosAccordionOpen[i] || false}
                            >
                              <AccordionSummary
                                expandIcon={
                                  <ExpandMoreIcon
                                    onClick={() => {
                                      onExpandVideosAccordion(i);
                                    }}
                                  />
                                }
                                aria-controls={`${i}_video`}
                                id={`${i}_video`}
                              >
                                <p>Lectures - {videos.length || 0}</p>
                              </AccordionSummary>
                              <AccordionDetails>
                                {videos && videos.length > 0 && (
                                  <Grid container spacing={3}>
                                    {videos.map((v, i) => {
                                      let { title, url, duration } = v;
                                      const progress = videoProgress[url.value];

                                      return (
                                        <React.Fragment key={i}>
                                          {/* video title */}
                                          <Grid item md={6}>
                                            <p>
                                              {i + 1}. {title.value}
                                            </p>
                                            <div className={classes.duration}>
                                              <MdOndemandVideo />
                                              {formatVideoDuration(duration)}
                                            </div>
                                          </Grid>

                                          {/* actions */}
                                          <Grid
                                            item
                                            md={4}
                                            sx={{
                                              display: "flex",
                                              justifyContent: "center",
                                              alignItems: "center",
                                              gap: 1.5,
                                            }}
                                          >
                                            <FaPlayCircle
                                              className="cp"
                                              onClick={() =>
                                                handlePlayVideo(
                                                  url.value,
                                                  duration
                                                )
                                              }
                                              size={25}
                                              color="orange"
                                            />
                                          </Grid>

                                          {typeof progress === "number" && (
                                            <Grid item md={2} mt={1}>
                                              <Box width={50}>
                                                <CircularProgressbar
                                                  styles={buildStyles({
                                                    pathColor: "#4BAF40",
                                                    textColor: "#4BAF40",
                                                  })}
                                                  value={progress}
                                                  text={`${progress}%`}
                                                />
                                              </Box>
                                            </Grid>
                                          )}
                                        </React.Fragment>
                                      );
                                    })}
                                  </Grid>
                                )}
                              </AccordionDetails>
                            </Accordion>
                          </AccordionDetails>
                        </Accordion>
                      </Box>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      )}

      <Card ref={addSectionRef} sx={{ mt: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography gutterBottom variant="h5" component="div">
              {typeof selectedSection === "number"
                ? `Edit - Section ${selectedSection + 1}: ${
                    sections[selectedSection]?.title?.value
                  }`
                : "Add Section"}{" "}
            </Typography>
            <Button
              onClick={onClearSection}
              variant="text"
              color="warning"
              endIcon={<MdOutlineClose />}
            >
              Clear Section
            </Button>
          </Box>

          <Box
            component="form"
            noValidate
            onSubmit={onSubmitForm.bind(this)}
            sx={{ mt: 2 }}
          >
            <Grid container spacing={2}>
              {/*title name */}
              <Grid item md={6}>
                <TextField
                  error={section.title.error}
                  helperText={section.title.errorMessage}
                  margin="normal"
                  placeholder="Enter Section Title"
                  required
                  fullWidth
                  id="title"
                  label="Section Title"
                  name="title"
                  value={section.title.value}
                  onChange={onSectionValueChangeHandler}
                />
              </Grid>

              {/* Videos Upload button */}
              <Grid item md={3}>
                <input
                  ref={videoUploadRef}
                  type="file"
                  accept="video/mp4"
                  multiple
                  id="videoUpload"
                  style={{ display: "none" }}
                  onChange={handleVideoChange}
                />
                <label htmlFor="videoUpload">
                  <Button
                    component="span"
                    fullWidth
                    sx={{ mt: 3 }}
                    variant="contained"
                    color="inherit"
                    startIcon={<FaCloudUploadAlt />}
                  >
                    Upload Lectures
                  </Button>
                </label>
                {section.videos.error && (
                  <FormHelperText error>
                    {section.videos.errorMessage}
                  </FormHelperText>
                )}
              </Grid>
              {/* Resources Upload button */}
              <Grid item md={3}>
                <input
                  ref={resourceUploadRef}
                  type="file"
                  accept="*"
                  multiple
                  id="resourceUpload"
                  style={{ display: "none" }}
                  onChange={handleResourceChange}
                />
                <label htmlFor="resourceUpload">
                  <Button
                    component="span"
                    fullWidth
                    sx={{ mt: 3 }}
                    variant="contained"
                    color="warning"
                    startIcon={<MdEditDocument />}
                  >
                    Upload Resources
                  </Button>
                </label>
                {section.resources.error && (
                  <FormHelperText error>
                    {section.resources.errorMessage}
                  </FormHelperText>
                )}
              </Grid>

              {/* resource display */}
              <Grid item md={12}>
                <Accordion defaultExpanded={true}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1-resource"
                    id="panel1-resource"
                  >
                    <h3>
                      Resources Available -{" "}
                      {section.resources.value?.length || 0}
                    </h3>
                  </AccordionSummary>
                  <AccordionDetails>
                    {/* checkbox resources actions */}
                    {selectedResourcesIndex.length > 0 && (
                      <Grid item md={12}>
                        <div className={classes.checkboxActionContainer}>
                          <Checkbox
                            checked={allResourcesSelected}
                            onChange={(e) => onSelecteAllResources(e)}
                            sx={{
                              mt: 3,
                            }}
                          />
                          <Box mt={3}>
                            <FaTrash
                              className="cp"
                              onClick={() => onRemoveResourceFromSection()}
                              size={17}
                              color="red"
                            />
                          </Box>
                        </div>

                        <Divider />
                      </Grid>
                    )}
                    {section.resources.value &&
                      section.resources.value.length > 0 && (
                        <Droppable droppableId="resources">
                          {(provided) => (
                            <Grid
                              item
                              md={12}
                              className="resources"
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                            >
                              {section.resources.value.map((r, i) => {
                                let { title, url } = r;
                                let id = `resource-${i}`;
                                let checked =
                                  selectedResourcesIndex.includes(i);
                                return (
                                  <Draggable
                                    key={id}
                                    draggableId={id}
                                    index={i}
                                  >
                                    {(provided) => (
                                      <Grid
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        container
                                        spacing={3}
                                      >
                                        {/* checkbox */}
                                        <Grid item md={2}>
                                          <Checkbox
                                            onChange={() =>
                                              onChangeSelectedResourceIndex(i)
                                            }
                                            checked={checked}
                                            sx={{
                                              mt: 3,
                                            }}
                                          />
                                        </Grid>
                                        {/* resource title */}
                                        <Grid item md={4}>
                                          <TextField
                                            variant="standard"
                                            error={title.error}
                                            helperText={title.errorMessage}
                                            margin="normal"
                                            placeholder="Enter Resource Title"
                                            required
                                            fullWidth
                                            id="title"
                                            label="Resouce Title"
                                            name="title"
                                            value={title.value}
                                            onChange={(e) =>
                                              onSectionResourceValueChangeHandler(
                                                e,
                                                i
                                              )
                                            }
                                          />
                                        </Grid>
                                        {/* open resource */}
                                        <Grid
                                          item
                                          md={4}
                                          className={
                                            classes.playButtonContainer
                                          }
                                        >
                                          <Button
                                            className={classes.playButton}
                                            onClick={() =>
                                              handleOpenResource(url.value)
                                            }
                                            startIcon={<MdDocumentScanner />}
                                          >
                                            Open Resource
                                          </Button>
                                        </Grid>
                                        {/* actions */}
                                        <Grid
                                          item
                                          md={2}
                                          className={
                                            classes.actionButtonContainer
                                          }
                                        >
                                          <div
                                            className={classes.reOrderButton}
                                            {...provided.dragHandleProps}
                                          >
                                            <FaList size={15} />
                                          </div>
                                        </Grid>
                                      </Grid>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                            </Grid>
                          )}
                        </Droppable>
                      )}
                  </AccordionDetails>
                </Accordion>
              </Grid>
              {/* videos display */}
              <Grid item md={12}>
                <Accordion defaultExpanded={true}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1-videos"
                    id="panel1-videos"
                  >
                    <h3>
                      Lectures Available - {section.videos.value?.length || 0}
                    </h3>
                  </AccordionSummary>
                  <AccordionDetails>
                    {/* checkbox video actions */}
                    {selectedVideosIndex.length > 0 && (
                      <Grid item md={12}>
                        <div className={classes.checkboxActionContainer}>
                          <Checkbox
                            checked={allVideosSelected}
                            onChange={(e) => onSelectAllVideos(e)}
                            sx={{
                              mt: 3,
                            }}
                          />
                          <Box mt={3}>
                            <FaTrash
                              className="cp"
                              onClick={() => onRemoveVideoFromSection()}
                              size={17}
                              color="red"
                            />
                          </Box>
                        </div>

                        <Divider />
                      </Grid>
                    )}

                    {/* display videos */}
                    {section.videos.value &&
                      section.videos.value.length > 0 && (
                        <Droppable droppableId="videos">
                          {(provided) => (
                            <Grid
                              item
                              md={12}
                              className="videos"
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                            >
                              {section.videos.value.map((v, i) => {
                                let { title, url } = v;
                                let id = `video-${i}`;
                                let checked = selectedVideosIndex.includes(i);
                                return (
                                  <Draggable
                                    key={id}
                                    draggableId={id}
                                    index={i}
                                  >
                                    {(provided) => (
                                      <Grid
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        container
                                        spacing={3}
                                      >
                                        {/* checkbox */}
                                        <Grid item md={2}>
                                          <Checkbox
                                            onChange={() =>
                                              onChangeSelectedVideoIndex(i)
                                            }
                                            checked={checked}
                                            sx={{
                                              mt: 3,
                                            }}
                                          />
                                        </Grid>
                                        {/* video title */}
                                        <Grid item md={4}>
                                          <TextField
                                            variant="standard"
                                            error={title.error}
                                            helperText={title.errorMessage}
                                            margin="normal"
                                            placeholder="Enter Video Title"
                                            required
                                            fullWidth
                                            id="title"
                                            label="Video Title"
                                            name="title"
                                            value={title.value}
                                            onChange={(e) =>
                                              onSectionVideoValueChangeHandler(
                                                e,
                                                i
                                              )
                                            }
                                          />
                                        </Grid>
                                        {/* play video */}
                                        <Grid
                                          item
                                          md={4}
                                          className={
                                            classes.playButtonContainer
                                          }
                                        >
                                          <Button
                                            className={classes.playButton}
                                            onClick={() =>
                                              handlePlayVideo(url.value)
                                            }
                                            startIcon={<FaRegPlayCircle />}
                                          >
                                            Play Video
                                          </Button>
                                        </Grid>
                                        {/* actions */}
                                        <Grid
                                          item
                                          md={2}
                                          className={
                                            classes.actionButtonContainer
                                          }
                                        >
                                          <div
                                            className={classes.reOrderButton}
                                            {...provided.dragHandleProps}
                                          >
                                            <FaList size={15} />
                                          </div>
                                        </Grid>
                                      </Grid>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                            </Grid>
                          )}
                        </Droppable>
                      )}
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* add section button */}
              <Button
                sx={{ mt: 3 }}
                fullWidth
                onClick={onAddOrEditSection}
                variant="contained"
                endIcon={<TbNewSection size={15} />}
                color="info"
              >
                {typeof selectedSection === "number"
                  ? "Update Section"
                  : "Add Section"}
              </Button>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      <ReactModal
        isOpen={isModalOpen}
        onRequestClose={handleCloseModal}
        contentLabel="Video Modal"
        overlayClassName={classes.modalOverlay}
        className={classes.modalContent}
      >
        <div>
          <ReactPlayer
            config={{ file: { attributes: { controlsList: "nodownload" } } }}
            url={videoUrl}
            playing
            controls
            width="100%"
            height="100%"
          />
        </div>
        <Box sx={{ px: 1, py: 1 }}>
          <Button fullWidth variant="outlined" onClick={handleCloseModal}>
            Close
          </Button>
        </Box>
      </ReactModal>
    </DragDropContext>
  );
};

export default CreateEditCourse;
