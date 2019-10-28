const titlePath = [
  "ytd-video-primary-info-renderer",
  "h1",
  "yt-formatted-string",
];
const channelPath = [
  "ytd-video-secondary-info-renderer",
  "ytd-video-owner-renderer",
  "ytd-channel-name",
  "yt-formatted-string",
  "a",
];

const title = document.querySelector(titlePath.join(" ")).innerText;
const channel = document.querySelector(channelPath.join(" ")).innerText;

return { name: title, artist: channel };
