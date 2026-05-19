document.addEventListener("DOMContentLoaded", () => {
  const html = document.documentElement;
  const audio = document.getElementById("disco-audio");
  const playButton = document.getElementById("disco-play-button");
  if (!audio || !playButton) {
    return;
  }
  audio.volume = 0.90;
  function isDiscoTheme() {
    return html.dataset.theme === "discoo";
  }
  async function playDisco() {
    if (!isDiscoTheme()) {
      audio.pause();
      audio.currentTime = 0;
      playButton.hidden = true;
      return;
    }
    try {
      await audio.play();
      playButton.hidden = true;
    } catch (error) {
      playButton.hidden = false;
    }
  }
  playButton.addEventListener("click", () => {
    playDisco();
  });
  playDisco();
});