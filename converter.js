document.getElementById("convertBtn").addEventListener("click", async () => {
    const fileInput = document.getElementById("audioFile");
    if (!fileInput.files.length) return alert("Please select an MP3 file");

    const file = fileInput.files[0];
    const audioContext = new AudioContext();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

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

    document.getElementById("previewAudio").src = URL.createObjectURL(new Blob([arrayBuffer], { type: "audio/mp3" }));
    document.getElementById("downloadBtn").style.display = "block";
});

document.getElementById("downloadBtn").addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = document.getElementById("previewAudio").src;
    link.download = "stereo_audio.mp3";
    link.click();
});
