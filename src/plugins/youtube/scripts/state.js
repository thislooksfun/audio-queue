const v = Array.from(document.getElementsByTagName("video"))[0];
const ended = document.querySelector("#movie_player.ended-mode") != null;

return { paused: v.paused, time: v.currentTime, duration: v.duration, ended };
