import React from "react";
import { format } from "date-fns";
import styles from "./styles.scss";

const prompts = ["It's never just rain …", "The weather here today is …"];

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.contentRef = React.createRef();
    this.state = {
      content: localStorage.weatherReport || "",
      now: new Date(),
      locationText: "",
      locationInputOpen: false,
      customLocationText: ""
    };
    this.handleLocationFocus = this.handleLocationFocus.bind(this);
    this.handleLocationBlur = this.handleLocationBlur.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleLocationClick = this.handleLocationClick.bind(this);
    this.handleLocationInputChange = this.handleLocationInputChange.bind(this);
    this.handleLocationInputKeyPress = this.handleLocationInputKeyPress.bind(
      this
    );
  }

  componentDidMount() {
    this.contentRef.current.focus();
    this.contentRef.current.setSelectionRange(
      this.state.content.length,
      this.state.content.length
    );

    this.timerID = setInterval(() => this.setState({ now: new Date() }), 30000);
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  handleChange(event) {
    localStorage.weatherReport = event.target.value;
    this.setState({ content: event.target.value });
  }

  handleLocationBlur(event) {
    const location = event.target.innerText;
    if (location.length === 0 || location === "an undisclosed location") {
      localStorage.textLocation = null;
      this.setState({ location: null });
    } else {
      localStorage.textLocation = location;
      this.setState({ location: location });
    }
  }

  handleLocationFocus(event) {
    console.log("focussed", !this.state.location);
    if (!this.state.location) {
      this.setState({ location: "" });
    }
  }

  handleLocationClick(event) {
    event.preventDefault();

    const success = p => {
      clearTimeout(promptTimeout);
      this.locationCoordinates = p;
      fetch(
        `https://nominatim.openstreetmap.org/reverse.php?format=jsonv2&lat=${
          p.coords.latitude
        }&lon=${p.coords.longitude}&zoom=18`
      )
        .then(res => res.json())
        .then(({ address: { village, town, suburb, country } }) => {
          this.setState({
            locationText: this.locationCustomised
              ? this.state.customLocationText
              : `${village || town || suburb}, ${country}`,
            locationInputOpen: false
          });
        });
    };

    const err = err => {
      this.setState({
        locationInputOpen: true
      });
      this.customLocationInputRef.focus();
    };

    const promptTimeout = setTimeout(() => {
      this.setState({
        locationInputOpen: true
      });
      this.customLocationInputRef.focus();
    }, 3000);

    if ("geolocation" in navigator && !this.locationCoordinates) {
      // status. = "Locating…";
      console.log("locating");
      navigator.geolocation.getCurrentPosition(success, err, {
        timeout: 10 * 1000
      });
    } else {
      this.setState({
        locationInputOpen: true
      });
      this.customLocationInputRef.focus();
    }
  }

  handleLocationInputKeyPress(event) {
    console.log("event", event.key);
    if (event.key === "Enter") {
      this.setState({
        locationInputOpen: false,
        locationText: this.state.customLocationText
      });
      this.locationCustomised = true;
    }

    if (event.keyCode === 27) {
      this.setState({
        customLocationText: "",
        locationInputOpen: false
      });
    }
  }

  handleLocationInputChange(event) {
    this.setState({
      customLocationText: event.target.value
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    const { locationText, customLocationText, content, now } = this.state;
    const data = {
      locationText,
      customLocationText,
      content,
      now,
      coordinates: this.locationCoordinates
    };
    fetch(ENDPOINT_SEND, {
      method: "POST",
      // mode: "cors", // no-cors, cors, *same-origin
      // cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      // credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json"
        // "Content-Type": "application/x-www-form-urlencoded",
      },
      redirect: "follow", // manual, *follow, error
      // referrer: "no-referrer", // no-referrer, *client
      body: JSON.stringify(data) // body data type must match "Content-Type" header
    }).then(console.log); // parses response to JSON
  }

  render() {
    const {
      content,
      now,
      locationText,
      customLocationText,
      locationInputOpen
    } = this.state;
    return (
      <div className={styles.container}>
        <textarea
          ref={this.contentRef}
          className={styles.weather}
          value={content}
          placeholder={prompts[Math.floor(Math.random() * prompts.length)]}
          onChange={this.handleChange}
        />
        <div className={styles.submitContainer}>
          <button onClick={this.handleSubmit} className={styles.submit}>
            Send report
          </button>
          <details>
            <summary>?</summary>
            <div className={styles.dialog}>
              <blockquote>
                <p>
                  A sorrowful sight I saw: dark night coming down prematurely,
                  and sky and hills mingled in one bitter whirl of wind and
                  suffocating snow.
                </p>
                <cite>
                  <a href="http://www.gutenberg.org/cache/epub/768/pg768.txt">
                    Wuthering Heights
                  </a>{" "}
                  <br />
                  by Emily Bronte
                </cite>
              </blockquote>
              <p>
                I like collecting descriptions of the weather. Any weather
                reports you submit will simply be emailed{" "}
                <a href="https://elvery.net">to me</a>.
              </p>
              <small>
                <a href="/terms-and-privacy/">terms / privacy</a>
              </small>
            </div>
          </details>
        </div>
        <section className={styles.meta}>
          <span>
            It's {format(now, "dddd h:mma")} in{" "}
            <details open={locationInputOpen} className={styles.location}>
              <summary
                onClick={this.handleLocationClick}
                className={styles.locationText}
              >
                {locationText ? locationText : "an undisclosed location"}
              </summary>
              <div>
                <p>
                  Don't want to give permission? Location not correct? That's
                  cool.
                </p>
                <input
                  onKeyDown={this.handleLocationInputKeyPress}
                  onChange={this.handleLocationInputChange}
                  className={styles.locationInput}
                  value={customLocationText}
                  placeholder="Enter a custom location"
                  ref={ref => (this.customLocationInputRef = ref)}
                  type="text"
                />
              </div>
            </details>
          </span>
        </section>
      </div>
    );
  }
}
