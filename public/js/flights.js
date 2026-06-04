async function searchFlights() {

const params = new URLSearchParams(window.location.search);

const origin =
params.get('origin')?.toUpperCase();

const destination =
params.get('destination')?.toUpperCase();

const departuredate =
params.get('departuredate');

const adults =
params.get('adults') || 1;

document.getElementById('routeTitle').innerHTML =

`${origin} → ${destination} | ${departuredate}`;

const res = await fetch(
`/flights?origin=${origin}&destination=${destination}&date=${departuredate}&adults=${adults}`
);

const flights = await res.json();

let html = "";

if(!flights.length){

html = `

<div style="
background:white;
margin:20px;
padding:40px;
border-radius:20px;
text-align:center;
font-size:22px;
">

No Flights Found ✈️

</div>

`;

}

flights.forEach(f => {

html += `

<div class="flight-card">

<div class="flight-top">

<div>

<div class="airline">

${f.airline || 'Air India'}

</div>

<div class="flight-number">

${f.flight || f.flightNo}

</div>

</div>

<div>

<span class="badge ${f.source === 'efly'
? 'efly'
: 'mongodb'}">

${(f.source || 'LIVE').toUpperCase()}

</span>

</div>

<div class="price">

₹${f.fare || f.baseFare}

</div>

</div>

<div class="route">

<div class="city">

<h2>${f.origin}</h2>

<p>

${f.depTime || f.departure}

</p>

</div>

<div class="line"></div>

<div class="city">

<h2>${f.destination}</h2>

<p>

${f.arrival || '--'}

</p>

</div>

</div>

<div class="extra">

<div>

Date:
${f.doj || f.date}

</div>

<div>

Seats:
${f.pax || f.seats}

</div>

</div>

<button

class="book-btn"

onclick='selectFlight(${JSON.stringify(f)})'>

Book Now

</button>

</div>

`;

});

document.getElementById('results').innerHTML = html;

}

function selectFlight(flight){

localStorage.setItem(

"selectedFlight",

JSON.stringify(flight)

);

window.location.href="/booking.html";

}

/* DATE BUTTONS */

function changeDate(days){

const params =
new URLSearchParams(window.location.search);

const current =
new Date(params.get('departuredate'));

current.setDate(current.getDate() + days);

const yyyy =
current.getFullYear();

const mm =
String(current.getMonth()+1)
.padStart(2,'0');

const dd =
String(current.getDate())
.padStart(2,'0');

const newDate =
`${yyyy}-${mm}-${dd}`;

params.set('departuredate', newDate);

window.location.href =
`/flights.html?${params.toString()}`;

}

searchFlights();