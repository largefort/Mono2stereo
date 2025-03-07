document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("audioFile");
    const convertBtn = document.getElementById("convertBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const previewAudio = document.getElementById("previewAudio");

    let selectedFile = null; // Stores the latest selected file

    // Capture the latest file when user selects a new file
    fileInput.addEventListener("change", (event) => {
        if (event.target.files.length > 0) {
            selectedFile = event.target.files[0]; // Get latest file
            console.log("File Selected:", selectedFile.name);
        }
    });

    // Convert Mono to Stereo when clicking the button
    convertBtn.addEventListener("click", async () => {
        if (!selectedFile) {
            alert("Please select an MP3 or WAV file before converting.");
            return;
        }

        const fileType = selectedFile.type;

        // Validate file format
        if (fileType !== "audio/mpeg" && fileType !== "audio/wav") {
            alert("Invalid file format! Please upload an MP3 or WAV file.");
            return;
        }

        try {
            const audioContext = new AudioContext();
            const arrayBuffer = await selectedFile.arrayBuffer();
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
            previewAudio.src = URL.createObjectURL(blob);
            downloadBtn.style.display = "block";

            console.log("Conversion Successful:", selectedFile.name);
        } catch (error) {
            console.error("Audio processing error:", error);
            alert("An error occurred while processing the audio. Please try another file.");
        }
    });

    // Handle MP3 Download
    downloadBtn.addEventListener("click", () => {
        if (!previewAudio.src) {
            alert("No converted file available.");
            return;
        }

        const link = document.createElement("a");
        link.href = previewAudio.src;
        link.download = "stereo_audio.mp3";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});
