const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "en-US";

const output = document.getElementById("output");
const stopButton = document.getElementById("stopButton");
const arc = document.getElementById("reactor");

let isListening = false;

function startListening() {
    if (!isListening) {
        isListening = true;
        output.innerText = "Listening...";
        arc.style.background = "radial-gradient(circle, #0f0, #000)";
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
    let maleVoice = voices.find(voice => voice.name.toLowerCase().includes('male'));

    if (!maleVoice) {
        maleVoice = voices[0];
    }

    speech.voice = maleVoice;
    speech.pitch = 1.0;
    speech.rate = 1.0;
    arc.style.background = "radial-gradient(circle, red, #000)";
    stopButton.style.display = "block";
    window.speechSynthesis.speak(speech);
    speech.onend = () => {
        arc.style.background = "radial-gradient(circle, #0f0, #000)";
        stopButton.style.display = "none";
    };
}

function processCommand(command) {
    // Greeting
    if (command.includes("start") || command.includes("start jarvis") || command.includes("hello") || command.includes("hello jarvis")) {
        const hour = new Date().getHours();
        let greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
        speak(`${greet} boss, how can I help you today?`);
    }
    // Who are you
    else if (command.includes("who are you")) {
        speak("I am Jarvis 2.0, your AI assistant.");
    }
    // Who is your boss
    else if (command.includes("who is your boss")) {
        speak("Rudra Pratap is my boss.");
    }
    // Time & Date
    else if (command.includes("time") || command.includes("date") || command.includes("day")) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = now.toLocaleDateString(undefined, options);
        const timeString = now.toLocaleTimeString();
        speak(`Today is ${dateString}. The time is ${timeString}`);
    }
    // Goodbye
    else if (command.includes("goodbye") || command.includes("shut down") || command.includes("bye")) {
        speak("Shutting down. Goodbye, boss.");
        isListening = false;
    }
    // Google Search
    else if (command.includes("according to google") || command.includes("who is") || command.includes("what is")) {
        const query = command.replace("according to google", "").trim();
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
        speak("Here is what I found on Google.");
    }
    // Math Calculation
    else if (command.startsWith("calculate")) {
        let expression = command
            .replace("calculate", "")
            .replace(/plus/g, '+')
            .replace(/minus/g, '-')
            .replace(/times/g, '*')
            .replace(/multiply/g, '*')
            .replace(/by|divided by/g, '/');
        try {
            let result = eval(expression);
            speak(`The result is ${result}`);
        } catch {
            speak("Sorry, I couldn't calculate that.");
        }
    }
    // Open Website
    else if (command.startsWith("open")) {
        let site = command.replace("open", "").trim();
        let url;

        if (site.includes("youtube") || site.includes("yt")) {
            url = "https://www.youtube.com";
        } else if (site.includes("google")) {
            url = "https://www.google.com";
        } else if (site.includes("instagram")) {
            url = "https://www.instagram.com";
        } else if (site.includes("facebook")) {
            url = "https://www.facebook.com";
        } else if (site.includes("twitter")){
            url = "https://www.twitter.com";
        } else {
            url = "https://www." + site + ".com";
        }

        if (url) {
            window.open(url, '_blank');
            speak(`Opening ${site}.`);
        } else {
            speak(`Sorry, I could not open ${site}`);
        }
    }
    else {
        speak("Sorry, I did not understand that.");
    }
}

stopButton.addEventListener("click", () => {
    window.speechSynthesis.cancel();
    stopButton.style.display = "none";
    arc.style.background = "radial-gradient(circle, #0f0, #000)";
});

// DateTime Widget
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    const formatted = `${now.toLocaleDateString(undefined, options)} - ${now.toLocaleTimeString()}`;
    document.getElementById("dateTimeDisplay").innerText = formatted;
}
setInterval(updateDateTime, 1000);
updateDateTime();