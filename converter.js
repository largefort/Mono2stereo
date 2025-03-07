document.addEventListener("DOMContentLoaded", () => {
    const convertBtn = document.getElementById("convertBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const previewAudio = document.getElementById("previewAudio");

    let selectedFile = null;

    // Register FilePond Plugins
    FilePond.registerPlugin(FilePondPluginFileValidateType);

    // Initialize FilePond
    const pond = FilePond.create(document.querySelector("#audioFile"), {
        acceptedFileTypes: ["audio/mpeg", "audio/wav"],
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

    // Convert Mono to Stereo
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
            const audioBuffer = await decodeAudioDataSafe(audioContext, arrayBuffer);

            if (!audioBuffer || audioBuffer.numberOfChannels === 0) {
                alert("⚠️ Error decoding the audio file. Please try again.");
                return;
            }

            // Convert Mono to Stereo
            const stereoBuffer = audioContext.createBuffer(2, audioBuffer.length, audioBuffer.sampleRate);
            for (let channel = 0; channel < 2; channel++) {
                stereoBuffer.copyToChannel(audioBuffer.getChannelData(0), channel);
            }

            // Create WAV file first
            const wavBlob = encodeWAV(stereoBuffer);

            // Convert WAV to MP3 using LAME.js
            const mp3Blob = await encodeMP3(wavBlob);

            // Set audio preview
            previewAudio.src = URL.createObjectURL(mp3Blob);
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
        link.download = "converted_audio.mp3";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Decode MP3/WAV safely with error handling
    async function decodeAudioDataSafe(audioContext, arrayBuffer) {
        return new Promise((resolve, reject) => {
            audioContext.decodeAudioData(
                arrayBuffer,
                (decodedData) => resolve(decodedData),
                (error) => {
                    console.error("Error decoding audio file:", error);
                    reject(error);
                }
            );
        });
    }

    // Encode WAV from Web Audio API buffer
    function encodeWAV(audioBuffer) {
        const numOfChan = audioBuffer.numberOfChannels,
            length = audioBuffer.length * numOfChan * 2 + 44,
            buffer = new ArrayBuffer(length),
            view = new DataView(buffer),
            channels = [],
            sampleRate = audioBuffer.sampleRate;

        // Write WAV header
        writeString(view, 0, "RIFF");
        view.setUint32(4, 32 + length, true);
        writeString(view, 8, "WAVE");
        writeString(view, 12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numOfChan, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2 * numOfChan, true);
        view.setUint16(32, numOfChan * 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, "data");
        view.setUint32(40, length, true);

        // Write audio samples
        for (let i = 0; i < numOfChan; i++) {
            channels.push(audioBuffer.getChannelData(i));
        }

        let offset = 44;
        for (let i = 0; i < audioBuffer.length; i++) {
            for (let j = 0; j < numOfChan; j++) {
                let sample = Math.max(-1, Math.min(1, channels[j][i]));
                sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(offset, sample, true);
                offset += 2;
            }
        }

        return new Blob([view], { type: "audio/wav" });
    }

    function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    // Convert WAV to MP3 using LAME.js
    async function encodeMP3(wavBlob) {
        const lame = await import("https://unpkg.com/lamejs@1.2.0/lame.all.js");
        const reader = new FileReader();

        return new Promise((resolve) => {
            reader.onload = function () {
                const wavArray = new Int16Array(reader.result);
                const mp3Encoder = new lame.Mp3Encoder(2, 44100, 128);
                const mp3Data = mp3Encoder.encodeBuffer(wavArray);
                const mp3Blob = new Blob(mp3Data, { type: "audio/mp3" });
                resolve(mp3Blob);
            };

            reader.readAsArrayBuffer(wavBlob);
        });
    }
});
