document.getElementById("convertBtn").addEventListener("click", async () => {
    const fileInput = document.getElementById("audioFile");

    // Ensure a file is selected
    if (!fileInput.files.length) {
        alert("Please select an MP3 or WAV file");
        return;
    }

    const file = fileInput.files[0];
    const fileType = file.type;

    // Validate audio format
    if (fileType !== "audio/mpeg" && fileType !== "audio/wav") {
        alert("Invalid file format! Please upload an MP3 or WAV file.");
        return;
    }

    try {
        const audioContext = new AudioContext();
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Ensure audio is valid
        if (!audioBuffer) {
            alert("Error decoding the audio file. Please try again.");
            return;
        }

        // Convert Mono to Stereo
        const stereoBuffer = audioContext.createBuffer(2, audioBuffer.length, audioBuffer.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
            stereoBuffer.copyToChannel(audioBuffer.getChannelData(0), channel);
        }

        // Play converted audio
        const source = audioContext.createBufferSource();
        source.buffer = stereoBuffer;
        source.connect(audioContext.destination);
        source.start();

        // Create Blob for download
        const blob = new Blob([arrayBuffer], { type: fileType });
        document.getElementById("previewAudio").src = URL.createObjectURL(blob);
        document.getElementById("downloadBtn").style.display = "block";

    } catch (error) {
        console.error("Audio processing error:", error);
        alert("An error occurred while processing the audio. Please try another file.");
    }
});

// Handle MP3 Download
document.getElementById("downloadBtn").addEventListener("click", () => {
    const audioSrc = document.getElementById("previewAudio").src;
    if (!audioSrc) {
        alert("No converted file available.");
        return;
    }

    const link = document.createElement("a");
    link.href = audioSrc;
    link.download = "stereo_audio.mp3";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});
