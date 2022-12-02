let agent = window.navigator.userAgent.toLowerCase();
console.log(`User Agent: ${agent}`);

export const DETECTIONS = {
  mobile: agent.includes("mobile"),
  iPad: agent.includes("ipad")
};

console.log("Browser detections: %o", DETECTIONS);
