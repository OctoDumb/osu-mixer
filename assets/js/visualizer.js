class Visualizer {
    /**
     * @param {HTMLCanvasElement} canvas Visualizer canvas
     * @param {HTMLAudioElement} audio Audio element
     */
    constructor(canvas, audio) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        window.addEventListener("resize", () => { this.resize() });

        this.hK = 200 / 255;

        let context = new AudioContext();

        let source = context.createMediaElementSource(audio);
        this.analyser = context.createAnalyser();
        let treble = 10;

        let filter = context.createBiquadFilter();
        filter.type = "highshelf";
        filter.frequency.value = 6e3;
        filter.gain.value = treble;

        source.connect(filter);
        filter.connect(context.destination);

        source.connect(this.analyser);
        this.analyser.connect(context.destination);

        this.analyser.fftSize = 256;

        this.buflen = this.analyser.frequencyBinCount - 30;

        this.array = new Uint8Array(this.analyser.frequencyBinCount);

        this.render();
    }

    render() {
        this.ctx.fillStyle = "#fff";

        this.analyser.getByteFrequencyData(this.array);

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let barWidth = Math.ceil(this.canvas.width / this.buflen);
        
        for(let i = 0; i < this.buflen; i++) {
            let barHeight = this.array[i] * this.hK;

            this.ctx.fillRect(barWidth * i, 200 - barHeight, barWidth, barHeight);
        }

        requestAnimationFrame(() => {
            this.render();
        });
    }

    resize() {
        this.canvas.width = window.innerWidth;
    }
}

module.exports = Visualizer;