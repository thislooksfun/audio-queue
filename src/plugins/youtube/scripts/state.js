const v = Array.from(document.getElementsByTagName("video"))[0];
return { paused: v.paused, time: v.currentTime, duration: v.duration };
