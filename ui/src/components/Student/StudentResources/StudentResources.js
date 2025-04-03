import { useContext, useEffect, useState } from "react";
import { ResourcesContext } from "../../../services/Resources/Resources.context";
import {
  Box,
  Button,
  IconButton,
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
  TextField,
} from "@mui/material";
import classes from "./StudentResources.module.css";
import TablePaginationActions from "@mui/material/TablePagination/TablePaginationActions";

import { Link } from "react-router-dom";
import { FaDownload, FaPlus } from "react-icons/fa";
import {
  NotFoundContainer,
  NotFoundContainerImage,
  NotFoundText,
} from "../../../styles";
import { MdDocumentScanner } from "react-icons/md";
import {
  downloadFileFromS3Url,
  generatePresignedUrl,
} from "../../../utility/s3Helpers";
import { hideLoader } from "../../../shared/Loader/Loader";
import { useDispatch } from "react-redux";
import { showNotification } from "../../../shared/Notification/Notification";
import _ from "lodash";

const StudentResources = ({ title }) => {
  const { onGetResources } = useContext(ResourcesContext);
  const [resources, setResources] = useState([]);
  const [orgResources, setOrgResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const dispatch = useDispatch();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    document.title = title;
    getResources();
  }, []);

  const getResources = () => {
    onGetResources(
      (result) => {
        setLoading(false);
        if (result.resources) {
          setResources(result.resources);
          setOrgResources(result.resources);
        }
      },
      true,
      false
    );
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
    setResources(filtered);
  };

  const handleOpenResource = async (path, duration) => {
    let previewUrl = await generatePresignedUrl(path);
    window.open(previewUrl, "__blank");
  };

  const onDownloadResource = async (resource) => {
    let { title, path } = resource;
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
    var currentResources = resources;
    let type = sort.type === "asc" ? "desc" : "asc";
    let fields = ["title"];
    if (fields.includes(fieldToSort)) {
      let sortedResources = _.orderBy(currentResources, fieldToSort, type);
      setSort((p) => ({
        ...p,
        type: type,
        field: fieldToSort,
      }));
      setResources(sortedResources);
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
        <h2>Available Resources - {resources.length}</h2>
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
        <Box mt={4}>
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
                      onClick={() => onChangeSorting("title")}
                    >
                      Title
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Action/Download</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(rowsPerPage > 0
                  ? resources.slice(
                      page * rowsPerPage,
                      page * rowsPerPage + rowsPerPage
                    )
                  : resources
                ).map((resource, index) => {
                  let { title, path, _id } = resource;

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
                      <TableCell>{title}</TableCell>
                      <TableCell>
                        <Button
                          className={classes.openButton}
                          onClick={() => handleOpenResource(path)}
                          startIcon={<MdDocumentScanner />}
                        >
                          Open Resource
                        </Button>
                      </TableCell>
                      <TableCell>
                        <FaDownload
                          size={15}
                          color="grey"
                          className="cp"
                          onClick={() => onDownloadResource(resource)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TablePagination
                    rowsPerPageOptions={[
                      10,
                      20,
                      50,
                      { label: "All", value: -1 },
                    ]}
                    count={resources.length}
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
        </Box>
      )}
    </>
  );
};

export default StudentResources;
