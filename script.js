// FRIDAY AI v2 - By Rudra (UI enhanced like JARVIS)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "en-US";

const output = document.getElementById("output");
const stopButton = document.getElementById("stopButton");
const arc = document.getElementById("reactor");

let isListening = false;
let voiceMode = "serious"; // "serious" or "casual"
let memory = JSON.parse(localStorage.getItem("fridayMemory")) || {};

function startListening() {
    if (!isListening) {
        isListening = true;
        output.innerText = "Listening...";
        arc.classList.add("speaking");
        try {
            recognition.start();
        } catch (error) {
            console.error("Error starting recognition:", error);
            isListening = false;
        }
    }
}

recognition.onresult = function(event) {
    const command = event.results[0][0].transcript.toLowerCase();
    output.innerText = "You said: " + command;
    processCommand(command);

    if (isListening && !command.includes("goodbye") && !command.includes("shut down") && !command.includes("bye")) {
        try {
            recognition.start();
        } catch (error) {
            console.error("Error restarting recognition:", error);
            isListening = false;
        }
    } else {
        isListening = false;
    }
};

recognition.onerror = function(event) {
    output.innerText = "Speech recognition error: " + event.error;
    console.error("Speech recognition error:", event.error);
};

function speak(text) {
    const speech = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    let selectedVoice = voices.find(voice => {
        if (voiceMode === "casual") return voice.name.toLowerCase().includes("female") || voice.name.toLowerCase().includes("samantha");
        return voice.name.toLowerCase().includes("male") || voice.name.toLowerCase().includes("david") || voice.name.toLowerCase().includes("google");
    });

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
    // Voice Mode Toggle
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

    // Memory Mode
    if (command.startsWith("remember that")) {
        const fact = command.replace("remember that", "").trim();
        const key = fact.split(" is ")[0];
        const value = fact.split(" is ")[1];
        memory[key] = value;
        localStorage.setItem("fridayMemory", JSON.stringify(memory));
        speak(`Got it. I'll remember that ${key} is ${value}`);
        return;
    }
    if (command.startsWith("what is my")) {
        const key = command.replace("what is my", "").trim();
        if (memory[key]) speak(`${key} is ${memory[key]}`);
        else speak("I don't remember that yet.");
        return;
    }

    // Reminders
    if (command.startsWith("remind me in")) {
        const minutes = parseInt(command.match(/\d+/));
        if (minutes) {
            speak(`Okay, I will remind you in ${minutes} minutes.`);
            setTimeout(() => speak("Hey! This is your reminder."), minutes * 60000);
        }
        return;
    }
    if (command.startsWith("remind me at")) {
        const timeMatch = command.match(/\d{1,2}(?::\d{2})?\s?(am|pm)?/);
        if (timeMatch) {
            const now = new Date();
            const target = new Date();
            const timeStr = timeMatch[0];
            let [hour, minute] = timeStr.includes(":") ? timeStr.split(":") : [timeStr, 0];
            hour = parseInt(hour);
            minute = parseInt(minute) || 0;
            if (/pm/.test(timeStr.toLowerCase()) && hour < 12) hour += 12;
            target.setHours(hour);
            target.setMinutes(minute);
            target.setSeconds(0);
            const delay = target.getTime() - now.getTime();
            if (delay > 0) {
                speak(`Reminder set for ${timeStr}`);
                setTimeout(() => speak("Hey! This is your scheduled reminder."), delay);
            } else {
                speak("That time has already passed today.");
            }
        }
        return;
    }

    // Date & Time
    if (command.includes("time") || command.includes("date") || command.includes("day")) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = now.toLocaleDateString(undefined, options);
        const timeString = now.toLocaleTimeString();
        speak(`Today is ${dateString}. The time is ${timeString}`);
        return;
    }

    // Google/Wiki Summary
    if (command.includes("according to google")) {
        let isShort = command.includes("in short");
        let isLong = command.includes("in long");
        let cleaned = command.replace("according to google", "").replace("in short", "").replace("in long", "").trim();

        if (!cleaned) {
            speak("Please say a topic after 'according to Google'.");
            return;
        }

        fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleaned)}`)
            .then(res => res.json())
            .then(data => {
                if (data.extract) {
                    let summary = isShort ? data.extract.split('. ')[0] + '.' : data.extract;
                    speak(summary);
                } else {
                    speak("I couldn't find information on that.");
                }
            })
            .catch(() => speak("Failed to fetch information."));
        return;
    }

    // Math & Logic
    if (command.startsWith("calculate") || command.match(/\d+/)) {
        let expression = command
            .replace("calculate", "")
            .replace(/plus/g, '+')
            .replace(/minus/g, '-')
            .replace(/times|multiply/g, '*')
            .replace(/divided by|by/g, '/')
            .replace(/percent of/g, '*0.01*')
            .replace(/[^0-9+\-*/().]/g, '');
        try {
            let result = eval(expression);
            if (!isNaN(result)) speak(`The result is ${result}`);
            else speak("I couldn't calculate that.");
        } catch {
            speak("Sorry, I couldn't calculate that.");
        }
        return;
    }

    // Open Websites
    if (command.startsWith("open")) {
        let site = command.replace("open", "").trim();
        let url = site.includes(".") ? `https://${site}` : `https://www.${site}.com`;
        speak(`Opening ${site}`);
        window.open(url, '_blank');
        return;
    }

    // Default Fallback
    speak("Sorry, I did not understand that.");
}

stopButton.addEventListener("click", () => {
    window.speechSynthesis.cancel();
    stopButton.style.display = "none";
    arc.classList.remove("speaking");
});

function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    const formatted = `${now.toLocaleDateString(undefined, options)} - ${now.toLocaleTimeString()}`;
    document.getElementById("dateTimeDisplay").innerText = formatted;
}
setInterval(updateDateTime, 1000);
updateDateTime();
