import { useContext, useEffect, useRef, useState } from "react";
import { ResourcesContext } from "../../../services/Resources/Resources.context";
import { SocketContext } from "../../../services/Socket/Socket.context";
import _ from "lodash";
import {
  Autocomplete,
  Box,
  Card,
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
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import Swal from "sweetalert2";
import {
  NotFoundContainer,
  NotFoundContainerImage,
  NotFoundText,
} from "../../../styles";
import { MdDocumentScanner, MdEditDocument, MdPeople } from "react-icons/md";
import { Link, useLocation, useNavigate } from "react-router-dom";
import classes from "./Resources.module.css";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import {
  downloadFileFromS3Url,
  generatePresignedUrl,
} from "../../../utility/s3Helpers";
import { FaDownload, FaList, FaTrash } from "react-icons/fa";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { hideLoader, showLoader } from "../../../shared/Loader/Loader";
import { useDispatch } from "react-redux";
import { showNotification } from "../../../shared/Notification/Notification";

const commonInputFieldProps = {
  value: "",
  focused: false,
  error: false,
  errorMessage: "",
};

const Resources = ({ title }) => {
  const {
    onGetResources,
    onEditResources,
    onRemoveResources,
    onCreateResources,
  } = useContext(ResourcesContext);

  const { socket, onFetchEvent, onEmitEvent } = useContext(SocketContext);
  const [resources, setResources] = useState([]);
  const [resourcesInput, setResourcesInput] = useState([]);

  const [orgResources, setOrgResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const resourceUploadRef = useRef();
  const location = useLocation();
  const [mode, setMode] = useState(null);
  const navigate = useNavigate();
  const [selectedResourcesIndex, setSelectedResourcesIndex] = useState([]);
  const [allResourcesSelected, setAllResourcesSelected] = useState(false);
  const [resourceProgress, setResourceProgress] = useState({});
  const dispatch = useDispatch();

  useEffect(() => {
    document.title = title;
    getResources();
  }, []);

  useEffect(() => {
    if (orgResources && orgResources.length > 0) {
      setMode("edit");
    }
  }, [orgResources]);

  useEffect(() => {
    if (socket) {
      const uploadProgressHandler = (data) => {
        let { type, path, progress } = data;
        if (type === "resource") {
          console.log("resource", path, progress);
          setResourceProgress((p) => ({
            ...p,
            [path]: progress,
          }));
        }
      };

      const eventHandler = (data) => {
        getResources();
      };
      onFetchEvent("resourceFileUploadProgress", uploadProgressHandler);
      onFetchEvent("refreshResources", eventHandler);
      return () => {
        socket?.off("refreshResources", eventHandler);
        socket?.off("resourceFileUploadProgress", uploadProgressHandler);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFetchEvent, socket]);

  useEffect(() => {
    if (
      selectedResourcesIndex &&
      selectedResourcesIndex.length > 0 &&
      resources &&
      resources.length === selectedResourcesIndex.length
    ) {
      setAllResourcesSelected(true);
    } else {
      setAllResourcesSelected(false);
    }
  }, [selectedResourcesIndex]);

  const onStructureData = (resources) => {
    let structuredResources = [];
    if (resources?.length > 0) {
      resources.forEach((r) => {
        let { title: resourceTitle, path, _id } = r;
        let resourceObj = {
          title: {
            ...commonInputFieldProps,
            value: resourceTitle,
          },
          id: {
            ...commonInputFieldProps,
            value: _id,
          },
          url: {
            ...commonInputFieldProps,
            value: path,
          },
        };
        structuredResources.push(resourceObj);
      });
    }
    setResources(structuredResources);
  };

  const onChangeSearchKeyword = (e) => {
    let value = e.target.value;
    setSearchKeyword(value);
    let filtered = orgResources;
    if (value) {
      value = value.toLowerCase();
      let finalResources = _.cloneDeep(orgResources);
      filtered = finalResources.filter((course) => {
        let { title } = course;
        let titleFound = title.toLowerCase().includes(value);

        return titleFound;
      });
    }
    onStructureData(filtered);
    // setResources(filtered);
  };

  const getResources = () => {
    onResetValues();
    onGetResources(
      (result) => {
        setLoading(false);
        if (result && result.resources) {
          //   setResources(result.resources);
          onStructureData(result.resources);
          setOrgResources(result.resources);
        }
      },
      true,
      false
    );
  };

  const handleResourceChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    // let base64 = await convertFileToBase64(selectedFile);
    let rsrcs = _.cloneDeep(resources || []);
    for (const file of selectedFiles) {
      let filename = file.name;
      let resourceExists = rsrcs.find(
        (r) => r.resource?.value?.name === filename
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
        rsrcs.push(obj);
      }
    }
    setResources(rsrcs);
    resourceUploadRef.current.value = "";
  };

  const onResourceReorder = (fromIndex, toIndex) => {
    let currentResources = _.cloneDeep(resources);
    if (currentResources?.length > 0) {
      let [reorderedItem] = currentResources.splice(fromIndex, 1);
      currentResources.splice(toIndex, 0, reorderedItem);
      setResources(currentResources);
    }
  };

  const onSelecteAllResources = () => {
    let checked = !allResourcesSelected;
    if (checked) {
      let resourcesLength = resources.length;
      let finalArray = _.range(resourcesLength);
      setSelectedResourcesIndex(finalArray);
    } else {
      setSelectedResourcesIndex([]);
    }
  };

  const handleOnDragEnd = (result) => {
    if (!result.destination || !result.source) {
      return;
    }
    let { droppableId, index } = result?.destination;
    let fromIndex = result?.source.index;
    let toIndex = index;
    setSelectedResourcesIndex([]);
    if (droppableId === "resources") {
      onResourceReorder(fromIndex, toIndex);
    }
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

  const onResourceValueChangeHandler = (e, index) => {
    const { name, value } = e.target;
    let currentResources = _.cloneDeep(resources);
    let currentResource = currentResources[index];
    currentResource[name].value = value;
    currentResource[name].error = false;
    currentResource[name].errorMessage = "";
    setResources(currentResources);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    let hadErrors = false;
    let rsrcs = _.cloneDeep(resources);
    rsrcs.forEach((r, i) => {
      let { title, resource } = r;
      if (!title.value) {
        title.error = true;
        title.errorMessage = "Resource Title Required";
        hadErrors = true;
      }
    });

    if (hadErrors) {
      setResources(rsrcs);
      return;
    }
    resourceUploadRef.current.value = "";

    let formData = new FormData();

    let data = {
      resources: [],
    };
    let structuredResources = [];

    rsrcs.forEach((r, ri) => {
      let { title, resource, url, id } = r;
      let resourceObj = {
        title: title.value,
        position: ri,
      };
      if (id) {
        resourceObj.id = id.value;
      }
      // send resources
      if (resource?.value) {
        formData.append("resources", resource.value, `resource${ri}`);
      } else {
        resourceObj.path = url.value;
      }
      structuredResources.push(resourceObj);
    });
    data.resources = structuredResources;

    formData.append("data", JSON.stringify(data));

    if (mode === "edit") {
      onEditResources(formData, (result) => {
        onEmitEvent("refreshResources");
      });
    } else {
      onCreateResources(formData, () => {
        onEmitEvent("refreshResources");
      });
    }
  };

  const onResetValues = () => {
    setResources([]);
    setMode(null);
    setResourceProgress({});
    setSelectedResourcesIndex([]);
    setAllResourcesSelected(false);
    resourceUploadRef.current.value = "";
  };

  const handleOpenResource = async (url, duration) => {
    console.log(url);
    if (url.startsWith("blob:")) {
      window.open(url, "__blank");
      return;
    }
    let previewUrl = await generatePresignedUrl(url);
    window.open(previewUrl, "__blank");
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
      let currentResources = _.cloneDeep(resources);

      const removeResource = () => {
        currentResources = currentResources.filter(
          (v, i) => !selectedResourcesIndex.includes(i)
        );
        setResources(currentResources);
        setSelectedResourcesIndex([]);
      };
      if (orgResources?.length > 0) {
        const resourcesToRemoveFromBackend = [];
        const resourcesToRemoveIndexes = [];
        selectedResourcesIndex.map((index) => {
          const resource = currentResources[index];
          if (resource?.resource?.value) {
            resourcesToRemoveIndexes.push(index);
          } else {
            resourcesToRemoveFromBackend.push({
              path: resource.url.value,
              _id: resource.id.value,
            });
          }
        });
        if (resourcesToRemoveFromBackend.length > 0) {
          let data = {
            resources: resourcesToRemoveFromBackend,
          };
          onRemoveResources(data, (result) => {
            onEmitEvent("refreshResources");
          });
        } else {
          removeResource();
        }
      } else {
        removeResource();
      }
    });
  };

  const onDownloadResource = async (resource) => {
    let { title, path } = resource;
    if (path.startsWith("blob")) {
      return;
    }

    showLoader(dispatch);
    try {
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

  return (
    <DragDropContext onDragEnd={handleOnDragEnd}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2>Available Resources - {resources.length}</h2>
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
            startIcon={<MdEditDocument />}
          >
            Upload Resources
          </Button>
        </label>
      </Box>

      {orgResources && orgResources.length > 0 && (
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
      )}

      {resources.length === 0 && !loading && (
        <NotFoundContainer>
          <div>
            <NotFoundText>No Resources Found</NotFoundText>
            <NotFoundContainerImage
              src={require("../../../assets/no_data.png")}
              alt="..."
            />
          </div>
        </NotFoundContainer>
      )}

      {resources && resources.length > 0 && (
        <>
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

          <Droppable droppableId="resources">
            {(provided) => (
              <Grid
                item
                md={12}
                className="resources"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {resources.map((r, i) => {
                  let { title, url } = r;
                  let id = `resource-${i}`;
                  let checked = selectedResourcesIndex.includes(i);
                  const progress = resourceProgress[url?.value];
                  return (
                    <Draggable key={id} draggableId={id} index={i}>
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
                              onChange={() => onChangeSelectedResourceIndex(i)}
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
                                onResourceValueChangeHandler(e, i)
                              }
                            />
                          </Grid>
                          {/* open resource */}
                          <Grid
                            item
                            md={4}
                            className={classes.playButtonContainer}
                          >
                            <Button
                              className={classes.playButton}
                              onClick={() => handleOpenResource(url.value)}
                              startIcon={<MdDocumentScanner />}
                            >
                              Open Resource
                            </Button>
                          </Grid>
                          {/* actions */}
                          <Grid
                            item
                            md={2}
                            className={classes.actionButtonContainer}
                          >
                            <div
                              className={classes.reOrderButton}
                              {...provided.dragHandleProps}
                            >
                              <FaList size={15} />
                            </div>
                            {!url?.value?.startsWith("blob") && (
                              <FaDownload
                                size={15}
                                color="grey"
                                className="cp"
                                onClick={() => onDownloadResource(r)}
                              />
                            )}

                            {typeof progress === "number" && (
                              <Box width={35}>
                                <CircularProgressbar
                                  styles={buildStyles({
                                    pathColor: "#4BAF40",
                                    textColor: "#4BAF40",
                                  })}
                                  value={progress}
                                  text={`${progress}%`}
                                />
                              </Box>
                            )}
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
          <LoadingButton
            type="button"
            fullWidth
            loadingPosition="end"
            onClick={onSubmit}
            endIcon={<MdPeople />}
            color="primary"
            loading={loading}
            loadingIndicator={"Adding..."}
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            {!loading && mode === "edit" ? "PROCEED & UPDATE" : "PROCEED & ADD"}
          </LoadingButton>
        </>
      )}
    </DragDropContext>
  );
};

export default Resources;
