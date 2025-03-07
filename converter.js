document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("audioFile");
    const convertBtn = document.getElementById("convertBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const previewAudio = document.getElementById("previewAudio");

    let selectedFile = null; // Store latest selected file

    // 🛠 Force File Selection to Work Properly on Mobile
    fileInput.addEventListener("click", () => {
        fileInput.value = ""; // Reset input field to allow re-selection
    });

    // Capture Latest File Selection
    fileInput.addEventListener("change", async (event) => {
        if (event.target.files.length > 0) {
            selectedFile = event.target.files[0]; // Store the latest file
            console.log("✅ File Selected:", selectedFile.name, selectedFile.type);

            // 🛠 Extra Fix for Mobile: Ensure Permission to Read File
            try {
                const fileAccess = await selectedFile.arrayBuffer();
                console.log("📂 File Access Confirmed:", fileAccess.byteLength);
            } catch (err) {
                console.error("⚠️ Unable to read file:", err);
                alert("❌ File access error. Please move your file to a public folder and try again.");
                selectedFile = null;
            }
        }
    });

    // Convert Mono to Stereo when clicking Convert Button
    convertBtn.addEventListener("click", async () => {
        if (!selectedFile) {
            alert("⚠️ Please select an MP3 or WAV file before converting.");
            return;
        }

        const fileType = selectedFile.type;
        const validFormats = ["audio/mpeg", "audio/wav"];

        // Validate file format
        if (!validFormats.includes(fileType)) {
            alert("❌ Invalid file format! Please upload an MP3 or WAV file.");
            return;
        }

        try {
            const audioContext = new AudioContext();
            const arrayBuffer = await selectedFile.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            // Ensure the audio file is valid
            if (!audioBuffer || audioBuffer.numberOfChannels === 0) {
                alert("⚠️ Error decoding the audio file. Please try again.");
                return;
            }

            // Convert Mono to Stereo
            const stereoBuffer = audioContext.createBuffer(2, audioBuffer.length, audioBuffer.sampleRate);
            for (let channel = 0; channel < 2; channel++) {
                stereoBuffer.copyToChannel(audioBuffer.getChannelData(0), channel);
            }

            // Play Converted Audio
            const source = audioContext.createBufferSource();
            source.buffer = stereoBuffer;
            source.connect(audioContext.destination);
            source.start();

            // Create Blob for Download
            const blob = new Blob([arrayBuffer], { type: fileType });
            previewAudio.src = URL.createObjectURL(blob);
            downloadBtn.style.display = "block";

            console.log("✅ Conversion Successful:", selectedFile.name);
        } catch (error) {
            console.error("⚠️ Audio processing error:", error);
            alert("❌ An error occurred while processing the audio. Please try another file.");
        }
    });

    // Handle MP3 Download
    downloadBtn.addEventListener("click", () => {
        if (!previewAudio.src) {
            alert("⚠️ No converted file available.");
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
