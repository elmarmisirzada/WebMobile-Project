# Grand Hall seat selection

A responsive front-end ticket-selection experience for a fictional theatre venue, built with HTML, CSS and JavaScript.

## Run locally

Open `index.html` in a modern browser. No build step or package installation is required.

## Venue model

The auditorium contains 196 generated seats across four sections:

| Section | Seats | Price |
| --- | ---: | ---: |
| Orchestra Center | 60 | $86 |
| Orchestra Left | 48 | $58 |
| Orchestra Right | 48 | $58 |
| Balcony | 40 | $32 |

Seat buttons are created from the section data in `app.js`. Selecting a seat displays its section, row, number, price and availability; it is only added to the cart after the explicit add action. Nine seats are marked unavailable for demonstration.

## Features

- Inspect available, unavailable and in-cart seats.
- Pan and zoom the seating map with the on-screen controls; reset it to the centered view.
- Use the mouse wheel to zoom and drag empty map space to pan.
- Add and remove tickets, prevent duplicate seat entries and calculate the cart total.
- Save the cart in `localStorage` and restore valid selections after reloading the page.
- Use the interface at desktop, tablet and mobile widths.

The project is a front-end demonstration. It does not reserve seats with a server, process payments or provide real-time availability.
