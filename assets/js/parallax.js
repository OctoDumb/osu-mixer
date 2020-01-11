var { remote } = require('electron');

class Parallax {
	/**
	 * 
	 * @param {HTMLCanvasElement} canvas Background canvas
	 */
	constructor(canvas) {
		this.canvas = canvas;
		this.ctx = this.canvas.getContext("2d");

		this.image = new Image();

		this.loaded = false;

		this.image.addEventListener("load", () => {
			this.loaded = true;
		}, false);


		document.body.addEventListener("mousemove", (ev) => {
			this.mouse = {
				x: ev.x,
				y: ev.y
			};
		}, false);

		this.mouse = {
			x: this.canvas.width / 2,
			y: this.canvas.height / 2
		};

		window.addEventListener("resize", () => { this.resize() });

		this.sizeK = 1.1;
		this.offsetK = 0.9;

		this.render();
	}

	setImage(src) {
		this.image.src = src;
	}

	compareSize() {
		return Math.max(
			this.canvas.width / this.image.width,
			this.canvas.height / this.image.height
		);
	}

	render() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		
		if(this.loaded) {
			let offMiddle = {
				x: (this.mouse.x - this.canvas.width / 2) / (this.canvas.width / 2),
				y: (this.mouse.y - this.canvas.height / 2) / (this.canvas.height / 2)
			};

			let s = this.compareSize();

			let size = {
				x: this.image.width * s * this.sizeK,
				y: this.image.height * s * this.sizeK
			};

			let offset = {
				x: (size.x - this.canvas.width) / 2 * (1 + offMiddle.x * this.offsetK),
				y: (size.y - this.canvas.height) / 2 * (1 + offMiddle.y * this.offsetK)
			}
			try {
				this.ctx.drawImage(this.image, -offset.x, -offset.y, size.x, size.y);
			}catch(e){}
		}

		this.ctx.fillStyle = "#000d";
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		requestAnimationFrame(() => {
			this.render();
		});
	}

	resize() {
		this.mouse.x *= window.innerWidth / this.canvas.width;
		this.mouse.y *= window.innerHeight / this.canvas.height;
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
	}

	copyImage() {
		remote.clipboard.writeImage(this.image, "clipboard");
	}
}

module.exports = Parallax;