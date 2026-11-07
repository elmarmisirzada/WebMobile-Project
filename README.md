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
- Navigate seats with Tab, the arrow keys, Home and End; press Enter or Space to inspect.
- Pan and zoom the seating map with the on-screen controls; reset it to the centered view. Controls stop at the map edges and zoom is limited to 80%–160%.
- Use the mouse wheel to zoom and drag empty map space to pan.
- Add and remove tickets, prevent duplicate seat entries and calculate the cart total.
- Hear seat and cart updates announced to assistive technology; keyboard focus moves to a remaining ticket after removal.
- Save the cart in `localStorage` and restore valid selections after reloading the page. Invalid, duplicate and unavailable seat IDs in saved data are discarded.
- Use the interface at desktop, tablet and mobile widths.

## Verification checklist

- Inspect an available seat and confirm the cart remains unchanged until **Add to cart** is pressed.
- Add a seat, inspect it again and confirm it cannot be added twice; inspect an unavailable seat and confirm adding is disabled.
- Add seats from multiple sections, remove one and confirm the map state and total update.
- Reload and confirm the remaining tickets and in-cart seat states are restored.
- Try malformed, duplicate, unavailable and unknown seat IDs in the saved cart; confirm only valid selections are restored.
- Try all four pan controls, both zoom controls, center/reset, mouse-wheel zoom and drag panning; verify movement and zoom limits.
- Navigate the seat map by keyboard and check the cart updates at desktop, tablet and mobile widths.

The project is a front-end demonstration. It does not reserve seats with a server, process payments or provide real-time availability.
