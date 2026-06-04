let passengerCount = 0;

// ================= ADD PASSENGER =================
function addPassenger(type = 'Adult') {

    passengerCount++;

    const div =
    document.createElement("div");

    div.innerHTML = `

        <h4>
            ${type} ${passengerCount}
        </h4>

        <select class="title">

            <option>Mr</option>
            <option>Mrs</option>
            <option>Ms</option>

        </select>

        <input
            type="text"
            name="firstName"
            placeholder="First Name"
            required
        >

        <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            required
        >

        <hr>

    `;

    document
    .getElementById("passengers")
    .appendChild(div);

    updateFare();

}
// ================= REMOVE PASSENGER =================

function loadPassengersFromSearch() {

    const pax =
    JSON.parse(
        localStorage.getItem(
            "selectedPax"
        )
    );

    if (!pax) {

        addPassenger();

        return;

    }

    // ADULT

    for (
        let i = 0;
        i < Number(pax.adults || 0);
        i++
    ) {

        addPassenger('Adult');

    }

    // CHILD

    for (
        let i = 0;
        i < Number(pax.child || 0);
        i++
    ) {

        addPassenger('Child');

    }

    // INFANT

    for (
        let i = 0;
        i < Number(pax.infant || 0);
        i++
    ) {

        addPassenger('Infant');

    }

}

function getPassengers() {
    const passengerDivs = document.querySelectorAll("#passengers > div");

    let passengers = [];

    passengerDivs.forEach(div => {
        const firstName = div.querySelector("input[name='firstName']")?.value;
const lastName = div.querySelector("input[name='lastName']")?.value;

        if (!firstName || !lastName) return;

        passengers.push({
            title: div.querySelector(".title")?.value,
            firstName,
            lastName
        });
    });

    return passengers;
}
// ================= LOAD USER =================
async function loadUser() {
    try {
        const res = await fetch('/auth/me', {
            credentials: 'include'
        });

        const user = await res.json();

        console.log("USER:", user); // 🔥 DEBUG

        document.getElementById('userName').innerText = user.name;
        document.getElementById('balance').innerText = user.balance ?? 0;

    } catch (err) {
        console.log(err);
    }
}

// ================= LOAD FLIGHT =================
function loadFlight() {
    const flight = JSON.parse(localStorage.getItem("selectedFlight"));

    document.getElementById("flightDetails").innerHTML = `
        <h3>${flight.airline} (${flight.flightNo})</h3>
        <p>${flight.origin} → ${flight.destination}</p>
        <p>${flight.departure} - ${flight.arrival}</p>
        <p><b>Date:</b> ${flight.date || "N/A"}</p>
        <h4 id="fareText"></h4>
    `;

    updateFare();
}
//

// ================= SELECT FLIGHT =================
function selectFlight(flight) {

    const params =
    new URLSearchParams(window.location.search);

    const date =
    params.get("departuredate");

    const adults =
    Number(params.get("adults") || 1);

    const child =
    Number(params.get("child") || 0);

    const infant =
    Number(params.get("infant") || 0);

    flight.date = date;

    localStorage.setItem(
        "selectedFlight",
        JSON.stringify(flight)
    );

    // SAVE PAX

    localStorage.setItem(

        "selectedPax",

        JSON.stringify({

            adults,
            child,
            infant

        })

    );

    window.location.href =
    "/booking.html";

}

// ================= UPDATE FARE =================
function updateFare() {
    const flight = JSON.parse(localStorage.getItem("selectedFlight"));

    const passengers = getPassengers();
    const count = passengers.length || 1;

    const pricePerPax = flight.baseFare ;
    const total = pricePerPax * count;

    document.getElementById("fareText").innerText =
        `₹${pricePerPax} × ${count} = ₹${total}`;
    document.getElementById("flightDetails").innerHTML = `
    <h3>${flight.airline} (${flight.flightNo})</h3>
    <p>${flight.origin} → ${flight.destination}</p>
    <p>${flight.departure} - ${flight.arrival}</p>
    <p>Date: ${flight.date || "N/A"}</p>
`;
}

// ================= BOOK =================
async function bookNow() {
    const flight = JSON.parse(localStorage.getItem("selectedFlight"));

    const passengerDivs = document.querySelectorAll("#passengers > div");

    let passengers = [];

    passengerDivs.forEach(div => {
        passengers.push({
            title: div.querySelector(".title").value,
            firstName: div.querySelector("input[name='firstName']").value,
            lastName: div.querySelector("input[name='lastName']").value
        });
    });

    const pax =
JSON.parse(
    localStorage.getItem(
        "selectedPax"
    )
);

const totalPax =

Number(pax?.adults || 0) +

Number(pax?.child || 0) +

Number(pax?.infant || 0);

if (
    passengers.length !== totalPax
) {

    alert(
        "Fill all passenger details ❌"
    );

    return;

}

    const res = await fetch('/booking/book-flight', {

    method: 'POST',

    headers: {

        'Content-Type': 'application/json'

    },

    credentials: 'include',

    body: JSON.stringify({

        flightId: flight._id,

        flightData: flight,

        origin: flight.origin,

        destination: flight.destination,

        depTime: flight.depTime,

        arrival: flight.arrival,

        doj: flight.doj,

        fare: flight.fare,

        passengers

    })

});

    const data = await res.json();

    alert(data.message || data.error);

    if (data.booking) {
        window.location.href =
"/ticket.html?pnr=" + data.booking.pnr; 
    }
}

// default 1 passenger
window.onload = () => {

    loadUser();

    loadFlight();

    loadPassengersFromSearch();

};
