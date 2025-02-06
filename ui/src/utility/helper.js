export function getFirebaseAccessUrl(path = "") {
  let URL =
    process.env.REACT_APP_FIREBASE_STORAGE_URL +
    path.replaceAll("/", "%2f") +
    "?alt=media";
  return URL;
}

export const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(file);
  });
};

export const convertFilesToBase64 = async (files) => {
  const base64Promises = Array.from(files).map((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  });

  const base64Results = await Promise.all(base64Promises);
  return base64Results;
};

export const superAdminRole = "superAdmin";
export const adminRole = "admin";
export const userRole = "user";
export const trainerRole = "trainer";

export const defaultRoles = [
  {
    label: "Super Admin",
    value: "superAdmin",
  },
  {
    label: "Admin",
    value: "admin",
  },
  {
    label: "Trainer",
    value: "trainer",
  },
  {
    label: "Student",
    value: "user",
  },
];

export function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours ? hours + "h " : ""}${
    remainingMinutes ? remainingMinutes + "m" : ""
  }`.trim();
}

export function formatTimeWithSeconds(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours ? hours + "h " : ""}${
    remainingMinutes ? remainingMinutes + "m " : ""
  }${remainingSeconds ? remainingSeconds + "s" : ""}`.trim();
}

export const getSubString = (text, limit) => {
  return text.length > limit ? text.substring(0, limit) + "..." : text;
};

export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
  });
};

export function scrollToElement(id, offset) {
  var element = document.getElementById(id);
  if (!element) {
    return;
  }
  var headerOffset = offset || 0;
  var elementPosition = element.getBoundingClientRect().top;
  var offsetPosition = elementPosition + window.pageYOffset - headerOffset;

  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth",
  });
}

export const getVideoDuration = (url) => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    // Reset the src attribute
    video.src = "";

    video.onloadedmetadata = () => {
      resolve(Math.floor(video.duration));
    };

    // Load the new video
    video.src = url;
  });
};

export const formatVideoDuration = (duration) => {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;

  let formattedDuration = "";

  if (hours > 0) {
    formattedDuration += `${hours}h `;
  }

  if (minutes > 0 || hours > 0) {
    formattedDuration += `${minutes}min `;
  }

  if (seconds > 0 || (hours === 0 && minutes === 0)) {
    formattedDuration += `${seconds}sec`;
  }

  return formattedDuration.trim();
};
