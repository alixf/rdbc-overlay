import * as moment from "moment";
import * as React from "react";

import "./style.less";

interface Player {
	number: number;
	name: string;
}
interface Team {
	name: string;
	score: number;
	jammer?: Player;
}
interface Clock {
	running: boolean;
	count: number;
	time: number;
	invertedTime: number;
}
interface OverlayState {
	teamA: Team;
	teamB: Team;
	periodClock: Clock;
	jamClock: Clock;
	timeoutClock: Clock;
	lineUpClock: Clock;
	intermissionClock: Clock;
}
export class Overlay extends React.Component<{}, OverlayState> {
	host = "localhost:1337/localhost:8000";
	key = "";

	constructor(props: {}) {
		super(props);
		this.state = {
			teamA: { name: "Team A", score: 0 },
			teamB: { name: "Team B", score: 0 },
			periodClock: { running: false, count: 0, time: 0, invertedTime: 0 },
			jamClock: { running: false, count: 0, time: 0, invertedTime: 0 },
			timeoutClock: { running: false, count: 0, time: 0, invertedTime: 0 },
			lineUpClock: { running: false, count: 0, time: 0, invertedTime: 0 },
			intermissionClock: { running: false, count: 0, time: 0, invertedTime: 0 }
		};
	}

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
			const node = documentElement.children.item(i);
			switch (node.nodeName) {
				case "ScoreBoard": this.parseScoreboard(node); break;
				// default: console.warn("not parsed", node); break;
			}
		}
	}

	parseScoreboard(scoreboardNode: Element) {
		for (let i = 0; i < scoreboardNode.children.length; i++) {
			const node = scoreboardNode.children.item(i);
			switch (node.nodeName) {
				case "Team": this.parseTeam(node); break;
				case "Clock": this.parseClock(node); break;
				default: console.warn("not parsed", node); break;
			}
		}
	}

	parseTeam(teamNode: Element) {
		const id = teamNode.getAttribute("Id");
		if (!id) {
			console.error("no id for parseTeam");
			return;
		}
		for (let i = 0; i < teamNode.children.length; i++) {
			const node = teamNode.children.item(i);
			switch (node.nodeName) {
				case "Name": this.setTeamName(id, node.textContent || ""); break;
				case "LeadJammer": console.warn(node); break;
				case "Score": this.setTeamScore(id, parseInt(node.textContent || "")); break;
				case "LastScore": console.warn(node); break;
				case "Position": this.setTeamJammer(id, this.parsePlayer(node)); break;
				default: console.warn("not parsed", node); break;
			}
		}
	}

	parsePlayer(playerNode: Element) {
		const numberNode = playerNode.querySelector("Number");
		const nameNode = playerNode.querySelector("Name");
		if (numberNode && nameNode) {
			return {
				number: parseInt(numberNode.textContent || ""),
				name: nameNode.textContent || ""
			};
		}
		return undefined;
	}

	setTeamJammer(id: string, jammer?: Player) {
		if (id === "1") {
			this.setState(state => ({ teamA: {...state.teamA, jammer} }));
		} else {
			this.setState(state => ({ teamB: {...state.teamB, jammer} }));
		}
	}

	setTeamName(id: string, name: string) {
		if (id === "1") {
			this.setState(state => ({ teamA: {...state.teamA, name} }));
		} else {
			this.setState(state => ({ teamB: {...state.teamB, name} }));
		}
	}

	setTeamScore(id: string, score: number) {
		if (id === "1") {
			this.setState(state => ({ teamA: {...state.teamA, score} }));
		} else {
			this.setState(state => ({ teamB: {...state.teamB, score} }));
		}
	}

	parseClock(clockNode: Element) {
		const id = clockNode.getAttribute("Id");
		if (!id) {
			console.error("no id for parseClock");
			return;
		}
		for (let i = 0; i < clockNode.children.length; i++) {
			const node = clockNode.children.item(i);
			switch (node.nodeName) {
				case "Running": this.setClockRunning(id, node.textContent || ""); break;
				case "Number": this.setClockNumber(id, parseInt(node.textContent || "")); break;
				case "Time": this.setClockTime(id, parseInt(node.textContent || "")); break;
				case "InvertedTime": this.setClockInvertedTime(id, parseInt(node.textContent || "")); break;
				default: console.warn("not parsed", node); break;
			}
		}
	}

	setClockRunning(id: string, runningString: string) {
		const running = runningString === "true";
		switch (id) {
			case "Period": this.setState(state => ({ periodClock: {...state.periodClock, running} })); break;
			case "Jam": this.setState(state => ({ jamClock: {...state.jamClock, running} })); break;
			case "Timeout": this.setState(state => ({ timeoutClock: {...state.timeoutClock, running} })); break;
			case "Lineup": this.setState(state => ({ lineUpClock: {...state.lineUpClock, running} })); break;
			case "Intermission": this.setState(state => ({ intermissionClock: {...state.intermissionClock, running} })); break;
			default: console.error("unknown clock", id); break;
		}
	}

	setClockNumber(id: string, number: number) {
		switch (id) {
			case "Period": this.setState(state => ({ periodClock: {...state.periodClock, count: number} })); break;
			case "Jam": this.setState(state => ({ jamClock: {...state.jamClock, count: number} })); break;
			case "Timeout": this.setState(state => ({ timeoutClock: {...state.timeoutClock, count: number} })); break;
			case "Lineup": this.setState(state => ({ lineUpClock: {...state.lineUpClock, count: number} })); break;
			case "Intermission": this.setState(state => ({ intermissionClock: {...state.intermissionClock, count: number} })); break;
			default: console.error("unknown clock", id); break;
		}
	}

	setClockTime(id: string, time: number) {
		switch (id) {
			case "Period": this.setState(state => ({ periodClock: {...state.periodClock, time} })); break;
			case "Jam": this.setState(state => ({ jamClock: {...state.jamClock, time} })); break;
			case "Timeout": this.setState(state => ({ timeoutClock: {...state.timeoutClock, time} })); break;
			case "Lineup": this.setState(state => ({ lineUpClock: {...state.lineUpClock, time} })); break;
			case "Intermission": this.setState(state => ({ intermissionClock: {...state.intermissionClock, time} })); break;
			default: console.error("unknown clock", id); break;
		}
	}

	setClockInvertedTime(id: string, invertedTime: number) {
		switch (id) {
			case "Period": this.setState(state => ({ periodClock: {...state.periodClock, invertedTime} })); break;
			case "Jam": this.setState(state => ({ jamClock: {...state.jamClock, invertedTime} })); break;
			case "Timeout": this.setState(state => ({ timeoutClock: {...state.timeoutClock, invertedTime} })); break;
			case "Lineup": this.setState(state => ({ lineUpClock: {...state.lineUpClock, invertedTime} })); break;
			case "Intermission": this.setState(state => ({ intermissionClock: {...state.intermissionClock, invertedTime} })); break;
			default: console.error("unknown clock", id); break;
		}
	}

	render() {
		return <div className="overlay">
			{this.renderTeam(this.state.teamA, "team-a")}
			{this.renderTeam(this.state.teamB, "team-b")}
			{this.renderClock(this.state.periodClock, "period")}
			{this.renderClock(this.state.jamClock, "jam")}
			{this.renderClock(this.state.timeoutClock, "timeout")}
			{this.renderClock(this.state.intermissionClock, "intermission")}
		</div>;
	}

	renderClock(clock: Clock, className: string) {
		return <div className={`clock ${className} ${clock.running ? "running" : ""}`}>
			<div className="time">{moment(clock.time).format("mm:ss")}</div>
			<div className="time inverted">{moment(clock.invertedTime).format("mm:ss")}</div>
			<div className="count">{clock.count}</div>
		</div>;
	}

	renderTeam(team: Team, className: string) {
		return <div className={`team ${className}`}>
			<div className="name">{team.name}</div>
			<div className="score">{team.score}</div>
		</div>;
	}
}
