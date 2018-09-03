
// DealerLocator

class DealerLocator extends React.Component {
    constructor(props) {
		super(props);
        this.state = {
            name: '',
            dealerTitle: '',
            dealerAddress: '',
            dealerCity: '',
            dealerState: '',
            dealerZipCode: '',
            dealerPhone: '',
            dealerWebsite: '',
            dealerId: '',
            dealers: [],
            submissionStatus: '',
            userLat: 0,
            userLon: 0,
            apiKey: '',
            isLoading: false,
            error: null
        }
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleGATrack = this.handleGATrack.bind(this);
        this.nearestPoint = this.nearestPoint.bind(this);
        this.deg2Rad = this.deg2Rad.bind(this);
        this.pythagorasEquirectangular = this.pythagorasEquirectangular.bind(this);
    }

    handleGATrack(event) {
        //event.preventDefault();
        console.log(this.state.dealerTitle, 'GA Track Click');
        //gaTrackEvent('cx9', 'exitTo', this.state.title);

    }

    handleSubmit(event) {
        event.preventDefault();
        this.setState({ 
            submissionStatus: 'Submitting...' 
        });
        const form = event.target;
        const data = new FormData(form);
        this.submitForm(form, data);
    }

    handleKeyUp(event) {
        if (event.keyCode == 13) { 
            this.handleSubmit(event);
        }
    }

    deg2Rad(deg) {
        return deg * Math.PI / 180;
    }

    pythagorasEquirectangular(lat1, lon1, lat2, lon2) {
        lat1 = this.deg2Rad(lat1);
        lat2 = this.deg2Rad(lat2);
        lon1 = this.deg2Rad(lon1);
        lon2 = this.deg2Rad(lon2);
        var R = 6371; // km
        var x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2);
        var y = (lat2 - lat1);
        var d = Math.sqrt(x * x + y * y) * R;
        return d;
    }

    nearestPoint(userLatitude, userLongitude) {
        var mindif = 99999;
        var closest;

        this.state.dealers.map((item, index) => {
            //walk the dealer array and determine closest dealer based on users submitted location
            var dif = this.pythagorasEquirectangular(userLatitude, userLongitude, item.latitude, item.longitude);
            if (dif < mindif) {
                closest = index;
                mindif = dif;
            }
        });
        
        console.log(this.state.dealers[closest], 'closest dealer');
        this.setState({
            dealerTitle: this.state.dealers[closest].title,
            dealerAddress: this.state.dealers[closest].street,
            dealerCity: this.state.dealers[closest].city,
            dealerState: this.state.dealers[closest].state_name,
            dealerZipCode: this.state.dealers[closest].postal_code,
            dealerPhone: this.state.dealers[closest].telephone,
            dealerWebsite: this.state.dealers[closest].url,
            dealerId: this.state.dealers[closest].id,
            submissionStatus: 'OK'
        });
    }

    submitForm(form, data) {
        const myForm = new Map();

        for(let fieldName of data.keys()) {
            const fieldInput = form.elements[fieldName];
            const fieldValue = form.elements[fieldName].value;

            if (fieldInput.className == "form-control") {
                console.log(fieldName, fieldValue);
                myForm.set(fieldName, fieldValue);
            }
        }
        //fetch('geocode.js?&address=' + myForm.get('zipcode') + '&key=' + this.state.apiKey, {
        fetch('https://maps.googleapis.com/maps/api/geocode/json?&address=' + myForm.get('zipcode') + '&key=' + this.state.apiKey, {
            method: 'GET'
        }).then(response => {
            if (response.ok) {
                  return response.json();
            } else {
                this.setState({ 
                    submissionStatus: 'Unable to determine your location' 
                });
            }
        }).then(json => {
            console.log(json.results[0], 'GA geocode json');
            this.setState({ 
                submissionStatus: 'Determining your location...<br/><img src="images/async_perms.gif"/>',
                userLat: json.results[0].geometry.location.lat,
                userLon: json.results[0].geometry.location.lng
            });
            //Find users closest dealer
            setTimeout(() => {
                this.nearestPoint(this.state.userLat, this.state.userLon); 
            }, 1000);            
        });
    }

    componentDidMount() {
        this.setState({ 
            isLoading: true 
        });
        fetch(this.props.jsonFile).then(response => {
            if (response.ok) {
                return response.json();
            } else {
                this.setState({ 
                    submissionStatus: 'Could not locate dealers file.' 
                });
            }
        }).then(data => {
            //console.log("dealers", data.dealers);
            //console.log("name", data.about.name);
		    this.setState({  
			    name: data.about.name,
			    dealers: data.dealers,
			    apiKey: data.about.apiKey,
			    isLoading: false 
		    })
	    }).catch(error => this.setState({ 
		    error, isLoading: false 
	    }));
    }
	
	render() {

	    if (this.state.isLoading) {
	        return <p>Loading Locator...<br/><img src="images/async_perms.gif"/></p>;
	    }

        return(
            <div>
                <div className="container">
                  <div className="row">
                    <div className="col-lg-offset-3 col-xs-12 col-lg-6">
                      <div className="jumbotron">
                        <div className="row text-center">
                          <div className="text-center col-xs-12 col-sm-12 col-md-12 col-lg-12">
                          <h4>{this.state.name}</h4>
                          </div>
                          <div className="text-center col-lg-12"> 
                            <form role="form" id="contactForm" className="text-center" onSubmit={this.handleSubmit}>
                              <div className="form-group">
                                <label htmlFor="zipcode">Enter Your Zip Code:</label>
                                <input type="text" className="form-control" id="zipcode" name="zipcode" maxLength="5" placeholder="Zip" required />
                              </div>
                              <div className="form-group">
                                  <button type="submit" id="locateFormSubmit" className="btn btn-primary btn-lg">Submit</button>
                              </div>
                            </form>
                          </div>
                        </div>
                        <div className="row text-center">
                            <div className="submission_result">
                                {this.state.submissionStatus == "OK"
                                    ? <a key={this.state.dealerId} href={this.state.dealerWebsite} target="_blank" onClick={this.handleGATrack}>
                                        <i className="fa fa-map-marker" aria-hidden="true"></i>
                                        {this.state.dealerTitle}
                                        <br />
                                        {this.state.dealerAddress} {this.state.dealerCity} {this.state.dealerState} {this.state.dealerZipCode}
                                        <br />
                                        {this.state.dealerPhone}
                                    </a>
                                   : <p dangerouslySetInnerHTML={{ __html: this.state.submissionStatus }} />
                                }
                            </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
        );
    }
}

ReactDOM.render(
  <DealerLocator jsonFile="dealers.js"/>,
  document.getElementById('locator')
);