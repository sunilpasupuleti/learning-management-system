import {
  Box,
  Button,
  TextField,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Menu,
  MenuItem,
} from "@mui/material";
import classes from "./StudentCourseView.module.css";
import { useContext, useEffect, useState } from "react";
import { formatVideoDuration, scrollToTop } from "../../../utility/helper";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CourseContext } from "../../../services/Courses/Courses.context";
import ReactPlayer from "react-player";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { GoVideo } from "react-icons/go";
import { GrResources } from "react-icons/gr";
import {
  downloadFileFromS3Url,
  generatePresignedUrl,
  onDownloadAllFilesFromS3,
} from "../../../utility/s3Helpers";
import { FaChevronDown, FaDownload } from "react-icons/fa";
import _ from "lodash";
import { hideLoader, showLoader } from "../../../shared/Loader/Loader";
import { showNotification } from "../../../shared/Notification/Notification";
import { useDispatch } from "react-redux";

const StudentCourseView = ({ title }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { onGetCourse } = useContext(CourseContext);
  const [course, setCourse] = useState(null);
  const [orgCourse, setOrgCourse] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [bannerUrl, setBannerUrl] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedResources, setSelectedResources] = useState({
    section: null,
    resources: [],
  });

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const dispatch = useDispatch();

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    document.title = title;
    scrollToTop();
    let courseId = searchParams.get("id");
    if (!courseId) {
      navigate("/student/courses");
      return;
    }
    if (courseId) {
      onGetCourse(
        courseId,
        async (result) => {
          let courseData = result.course;
          console.log(courseData);
          if (!courseData) {
            return;
          }
          document.title = `${courseData.title}`;
          let banner = await generatePresignedUrl(courseData.banner);
          setBannerUrl(banner);
          setCourse(courseData);
          setOrgCourse(courseData);
        },
        () => {
          navigate("/student/courses");
        },
        true,
        false
      );
    }
  }, []);

  useEffect(() => {
    if (selectedVideo) {
      scrollToTop();
      handlePlayVideo();
    }
  }, [selectedVideo]);

  const handlePlayVideo = async () => {
    let { path, duration } = selectedVideo;
    let previewUrl = await generatePresignedUrl(path, duration);
    setVideoUrl(previewUrl);
  };

  const onClickResourcesButton = (section, resources, event) => {
    setSelectedResources({
      section: section,
      resources: resources,
    });
    setAnchorEl(event.currentTarget);
  };

  const onDownloadResource = async (resource) => {
    showLoader(dispatch);
    try {
      let { title, path } = resource;
      const fileExtension = path.split("/").pop().split(".").pop();
      const fileName = `${title}.${fileExtension}`;
      hideLoader(dispatch);
      await downloadFileFromS3Url(path, fileName);
    } catch (e) {
      console.log(e);
      hideLoader(dispatch);
      showNotification({
        message: e.toString(),
        status: "error",
      });
    }
  };

  const onDownloadAllResources = async () => {
    showLoader(dispatch);
    try {
      let resources = selectedResources.resources.map((r) => {
        let { title, path } = r;
        const fileExtension = path.split("/").pop().split(".").pop();
        const fileName = `${title}.${fileExtension}`;
        return {
          path: path,
          fileName: fileName,
        };
      });
      hideLoader(dispatch);
      await onDownloadAllFilesFromS3(
        resources,
        `${selectedResources.section?.title}.zip`
      );
    } catch (e) {
      console.log(e);
      hideLoader(dispatch);
      showNotification({
        message: e.toString(),
        status: "error",
      });
    }
  };

  return (
    <>
      {course && (
        <div className={classes.container}>
          <div className={classes.content}>
            {videoUrl ? (
              <ReactPlayer
                config={{
                  file: { attributes: { controlsList: "nodownload" } },
                }}
                url={videoUrl}
                playing
                controls
                width="100%"
                className={classes.player}
                height="420px"
              />
            ) : (
              <img src={bannerUrl} alt="..." className={classes.banner} />
            )}

            <div className={classes.about}>
              <p className={classes.title}>
                {course.title} - <span>About this course</span>{" "}
              </p>
              <p className={classes.headline}>- {course.headline}</p>
              <p className="mt-1">
                Total Duration - {formatVideoDuration(course.totalDuration)}{" "}
              </p>
              <p className="mt-1">Total Lectures - {course.totalLectures} </p>
              <div className={classes.description}>
                <p>
                  <b>Description</b> :{" "}
                </p>
                {course.description && (
                  <div
                    dangerouslySetInnerHTML={{ __html: course.description }}
                  ></div>
                )}
              </div>
            </div>
          </div>

          <Box className={classes.videoSection}>
            {course.content.sections.map((s, i) => {
              let { title, resources, videos } = s;
              let totalVideosDuration = 0;
              videos.forEach((v) => (totalVideosDuration += v.duration));
              let sectionDuration = formatVideoDuration(totalVideosDuration);
              return (
                <Accordion
                  key={i}
                  sx={{
                    background: "#f7f8fa",
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls={`section_${i}`}
                    id={`section_${i}`}
                  >
                    <Box>
                      <h4>
                        Section {i + 1}: {title}
                      </h4>
                      <p className={classes.sectionDuration}>
                        {videos.length} videos | {sectionDuration}
                      </p>
                    </Box>
                  </AccordionSummary>

                  {resources && resources.length > 0 && (
                    <>
                      <div className={classes.resourcesButton}>
                        <Button
                          variant="outlined"
                          size="small"
                          endIcon={<GrResources />}
                          id={`menu_button`}
                          aria-controls={open ? `menu_resource` : undefined}
                          aria-haspopup="true"
                          aria-expanded={open ? "true" : undefined}
                          onClick={(e) =>
                            onClickResourcesButton(s, resources, e)
                          }
                        >
                          Resources
                        </Button>
                      </div>
                    </>
                  )}

                  {videos.map((v, vi) => {
                    let { title, path, duration } = v;
                    let active = selectedVideo?.path === path;
                    return (
                      <div
                        onClick={() => setSelectedVideo(v)}
                        key={vi}
                        className={`${classes.videoContainer} ${
                          active ? classes.active : ""
                        }`}
                      >
                        <p className={classes.videoTitle}>
                          {vi + 1}. {title}
                        </p>
                        <div className={classes.durationContainer}>
                          <GoVideo />
                          <div className={classes.duration}>
                            {formatVideoDuration(duration)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </Accordion>
              );
            })}
          </Box>

          <Menu
            id={`menu_resource`}
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              "aria-labelledby": `menu_button`,
            }}
          >
            <MenuItem onClick={() => onDownloadAllResources()}>
              Download All{" "}
              <span className="ml-1">
                <FaDownload color="var(--primary)" />
              </span>
            </MenuItem>
            {selectedResources.resources.map((r, ri) => {
              let { title } = r;
              return (
                <MenuItem key={ri} onClick={() => onDownloadResource(r)}>
                  {title}
                </MenuItem>
              );
            })}
          </Menu>
        </div>
      )}
    </>
  );
};

export default StudentCourseView;
