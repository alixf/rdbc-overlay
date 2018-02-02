import * as React from "react";

export class Overlay extends React.Component<{}> {
	host = "localhost:1337/localhost:8000";
	key = "";

	componentWillMount() {
		this.init();
	}

	init = async () => {
		await this.register();
		while (true) {
			await this.retrieveData();
		}
	}

	register = async () => {
		const response = await fetch(`http://${this.host}/XmlScoreBoard/register`);
		const result = await response.text();
		const parser = new DOMParser();
		const document = parser.parseFromString(result, "text/xml");
		const keyElement = document.querySelector("Key");
		if (keyElement && keyElement.textContent) {
			this.key = keyElement.textContent;
		}
	}

	retrieveData = async () => {
		const response = await fetch(`http://${this.host}/XmlScoreBoard/get?key=${this.key}`);
		const result = await response.text();
		const parser = new DOMParser();
		const document = parser.parseFromString(result, "text/xml");
		const documentElement = document.documentElement;
		for (let i = 0; i < documentElement.children.length; i++) {
			console.log(documentElement.children.item(i));
		}
	}

	render() {
		return <div>test</div>;
	}
}
