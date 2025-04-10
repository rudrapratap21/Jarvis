// Jarvis 2.0 - Premium Assistant Script
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "en-US";

const output = document.getElementById("output");
const stopButton = document.getElementById("stopButton");
const arc = document.getElementById("reactor");

let isListening = false;
let voiceMode = "serious";
let memory = JSON.parse(localStorage.getItem("jarvisMemory")) || {};

function startListening() {
  if (!isListening) {
    isListening = true;
    output.innerText = "Listening...";
    arc.classList.add("speaking");
    try {
      recognition.start();
    } catch (error) {
      console.error("Recognition error:", error);
      isListening = false;
    }
  }
}

recognition.onresult = function (event) {
  const command = event.results[0][0].transcript.toLowerCase();
  output.innerText = "You said: " + command;
  processCommand(command);

  if (isListening && !command.includes("goodbye")) {
    try {
      recognition.start();
    } catch {
      isListening = false;
    }
  } else {
    isListening = false;
  }
};

recognition.onerror = function (event) {
  output.innerText = "Error: " + event.error;
};

function speak(text) {
  const speech = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  let selectedVoice = voices.find(v =>
    voiceMode === "casual"
      ? v.name.toLowerCase().includes("female")
      : v.name.toLowerCase().includes("male")
  );
  if (!selectedVoice) selectedVoice = voices[0];

  speech.voice = selectedVoice;
  speech.pitch = 1.1;
  speech.rate = 1;
  arc.classList.add("speaking");
  stopButton.style.display = "block";
  window.speechSynthesis.speak(speech);
  speech.onend = () => {
    arc.classList.remove("speaking");
    stopButton.style.display = "none";
  };
}

function processCommand(command) {
  if (command.includes("casual mode")) {
    voiceMode = "casual";
    speak("Switched to casual mode.");
    return;
  }
  if (command.includes("serious mode")) {
    voiceMode = "serious";
    speak("Switched to serious mode.");
    return;
  }

  if (command.startsWith("remember that")) {
    const fact = command.replace("remember that", "").trim();
    const [key, value] = fact.split(" is ");
    memory[key] = value;
    localStorage.setItem("jarvisMemory", JSON.stringify(memory));
    speak(`Okay, I will remember that ${key} is ${value}`);
    return;
  }

  if (command.startsWith("what is my")) {
    const key = command.replace("what is my", "").trim();
    if (memory[key]) speak(`${key} is ${memory[key]}`);
    else speak("I don't remember that.");
    return;
  }

  if (command.includes("remind me in")) {
    const mins = parseInt(command.match(/\d+/));
    if (mins) {
      speak(`Reminder set for ${mins} minutes.`);
      setTimeout(() => speak("Hey! This is your reminder."), mins * 60000);
    }
    return;
  }

  if (command.includes("remind me at")) {
    const match = command.match(/\d{1,2}(:\d{2})?\s?(am|pm)?/);
    if (match) {
      const [time] = match;
      const target = new Date();
      const [hour, minute = 0] = time.includes(":") ? time.split(":") : [time, "0"];
      let h = parseInt(hour), m = parseInt(minute);
      if (/pm/.test(time) && h < 12) h += 12;
      target.setHours(h);
      target.setMinutes(m);
      target.setSeconds(0);
      const now = new Date();
      const delay = target - now;
      if (delay > 0) {
        speak(`Reminder set for ${time}`);
        setTimeout(() => speak("This is your scheduled reminder."), delay);
      } else {
        speak("That time has already passed today.");
      }
    }
    return;
  }

  if (command.includes("time") || command.includes("date") || command.includes("day")) {
    const now = new Date();
    const date = now.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    const time = now.toLocaleTimeString();
    speak(`Today is ${date}, and the time is ${time}`);
    return;
  }

  if (command.includes("according to google")) {
    let short = command.includes("in short");
    let long = command.includes("in long");
    let query = command.replace("according to google", "").replace("in short", "").replace("in long", "").trim();

    if (!query) {
      speak("Please say a topic after 'according to Google'.");
      return;
    }

    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        if (data.extract) {
          const summary = short ? data.extract.split(". ")[0] + "." : data.extract;
          speak(summary);
        } else {
          speak("I couldn't find anything on that. Opening Google.");
          window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
        }
      })
      .catch(() => {
        speak("Failed to fetch info. Opening Google.");
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
      });
    return;
  }

  if (command.includes("calculate") || command.match(/\d/)) {
    let expr = command
      .replace("calculate", "")
      .replace(/plus/g, "+")
      .replace(/minus/g, "-")
      .replace(/times|multiply/g, "*")
      .replace(/divided by|by/g, "/")
      .replace(/percent of/g, "*0.01*")
      .replace(/[^0-9+*/().-]/g, "");

    try {
      const result = eval(expr);
      if (!isNaN(result)) speak(`The result is ${result}`);
      else speak("I couldn't calculate that.");
    } catch {
      speak("Sorry, I couldn't calculate that.");
    }
    return;
  }

  if (command.startsWith("open")) {
    const site = command.replace("open", "").trim();
    const url = site.includes(".") ? `https://${site}` : `https://www.${site}.com`;
    speak(`Opening ${site}`);
    window.open(url, "_blank");
    return;
  }

  speak("Sorry, I did not understand that.");
}

stopButton.addEventListener("click", () => {
  window.speechSynthesis.cancel();
  stopButton.style.display = "none";
  arc.classList.remove("speaking");
});

function updateDateTime() {
  const now = new Date();
  const formatted = now.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  }) + " - " + now.toLocaleTimeString();
  document.getElementById("dateTimeDisplay").innerText = formatted;
}

setInterval(updateDateTime, 1000);
updateDateTime();
