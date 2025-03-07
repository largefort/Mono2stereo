document.addEventListener("DOMContentLoaded", () => {
    const convertBtn = document.getElementById("convertBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const previewAudio = document.getElementById("previewAudio");

    let selectedFile = null;

    // Register FilePond Plugins
    FilePond.registerPlugin(FilePondPluginFileValidateType);

    // Create FilePond instance
    const pond = FilePond.create(document.querySelector("#audioFile"), {
        acceptedFileTypes: ["audio/mp3", "audio/wav"],
        allowMultiple: false,
        onaddfile: (error, fileItem) => {
            if (error) {
                console.error("FilePond Error:", error);
                alert("Error selecting file. Please try again.");
                return;
            }
            selectedFile = fileItem.file;
            console.log("✅ File Selected:", selectedFile.name);
        }
    });

    // Convert to Stereo
    convertBtn.addEventListener("click", async () => {
        if (!selectedFile) {
            alert("⚠️ Please select an MP3 or WAV file before converting.");
            return;
        }

        const fileType = selectedFile.type;
        const validFormats = ["audio/mpeg", "audio/wav"];

        // Validate format
        if (!validFormats.includes(fileType)) {
            alert("❌ Invalid file format! Please upload an MP3 or WAV file.");
            return;
        }

        try {
            const audioContext = new AudioContext();
            const arrayBuffer = await selectedFile.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            // Ensure audio is valid
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
