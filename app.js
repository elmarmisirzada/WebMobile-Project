const venue = {
  sections: [
    { id: "balcony", name: "Balcony", category: "balcony", price: 32, rows: 4, seatsPerRow: 10, column: 2, gridRow: 1 },
    { id: "left", name: "Orchestra Left", category: "standard", price: 58, rows: 6, seatsPerRow: 8, column: 1, gridRow: 2 },
    { id: "center", name: "Orchestra Center", category: "premium", price: 86, rows: 6, seatsPerRow: 10, column: 2, gridRow: 2 },
    { id: "right", name: "Orchestra Right", category: "standard", price: 58, rows: 6, seatsPerRow: 8, column: 3, gridRow: 2 },
  ],
  unavailableSeats: new Set([
    "center-A-4",
    "center-B-7",
    "center-D-2",
    "left-A-3",
    "left-C-8",
    "right-B-5",
    "right-E-1",
    "balcony-A-6",
    "balcony-C-2",
  ]),
};

const storageKey = "grand-hall-ticket-cart-v1";
const seatingArea = document.querySelector("#seating-area");
const sectionPrices = document.querySelector("#section-prices");
const seatCount = document.querySelector("#seat-count");
const selectionEmpty = document.querySelector("#selection-empty");
const selectionDetails = document.querySelector("#selection-details");
const detailSection = document.querySelector("#detail-section");
const detailSeat = document.querySelector("#detail-seat");
const detailPrice = document.querySelector("#detail-price");
const detailStatus = document.querySelector("#detail-status");
const selectionHint = document.querySelector("#selection-hint");
const addButton = document.querySelector("#add-to-cart");
const cartList = document.querySelector("#cart-list");
const cartEmpty = document.querySelector("#cart-empty");
const cartCount = document.querySelector("#cart-count");
const headerCartCount = document.querySelector("#header-cart-count");
const cartTotal = document.querySelector("#cart-total");
const liveMessage = document.querySelector("#live-message");
const storageNotice = document.querySelector("#storage-notice");
const viewport = document.querySelector("#map-viewport");
const map = document.querySelector("#venue-map");
const zoomLevel = document.querySelector("#zoom-level");
const zoomInButton = document.querySelector("#zoom-in");
const zoomOutButton = document.querySelector("#zoom-out");
const resetButton = document.querySelector("#reset-view");

const seatsById = new Map();
const cart = new Set(loadCart());
let inspectedSeatId = null;
let mapScale = 1;
let mapX = 0;
let mapY = 0;
let dragState = null;
let suppressSeatClickUntil = 0;

function rowLabel(index) {
  return String.fromCharCode(65 + index);
}

function getSeatStatus(seatId) {
  if (venue.unavailableSeats.has(seatId)) {
    return "unavailable";
  }
  return cart.has(seatId) ? "in-cart" : "available";
}

function getSeatData(seatId) {
  const seat = seatsById.get(seatId);
  if (!seat) {
    return null;
  }
  return { ...seat, status: getSeatStatus(seatId) };
}

function createSeat(section, rowIndex, seatIndex) {
  const row = rowLabel(rowIndex);
  const number = seatIndex + 1;
  const id = `${section.id}-${row}-${number}`;
  const seat = document.createElement("button");
  seat.className = "seat available";
  seat.type = "button";
  seat.dataset.seatId = id;
  seat.tabIndex = rowIndex === 0 && seatIndex === 0 ? 0 : -1;
  seat.setAttribute("aria-pressed", "false");
  seat.addEventListener("click", () => {
    if (Date.now() >= suppressSeatClickUntil) {
      inspectSeat(id);
    }
  });
  seat.addEventListener("focus", () => setSectionTabStop(seat));
  seat.addEventListener("keydown", (event) => moveSeatFocus(event, seat));
  seatsById.set(id, { id, row, number, section, element: seat });
  updateSeatElement(id);
  return seat;
}

function setSectionTabStop(seat) {
  const section = seat.closest(".seat-section");
  section.querySelectorAll(".seat").forEach((sectionSeat) => {
    sectionSeat.tabIndex = sectionSeat === seat ? 0 : -1;
  });
}

function moveSeatFocus(event, seat) {
  const row = seat.closest(".seat-row");
  const section = seat.closest(".seat-section");
  const rowSeats = [...row.querySelectorAll(".seat")];
  const seatIndex = rowSeats.indexOf(seat);
  let target = null;

  if (event.key === "ArrowLeft") {
    target = rowSeats[seatIndex - 1];
  } else if (event.key === "ArrowRight") {
    target = rowSeats[seatIndex + 1];
  } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    const rows = [...section.querySelectorAll(".seat-row")];
    const rowIndex = rows.indexOf(row);
    const nextRow = rows[rowIndex + (event.key === "ArrowUp" ? -1 : 1)];
    const nextRowSeats = nextRow ? [...nextRow.querySelectorAll(".seat")] : [];
    target = nextRowSeats[Math.min(seatIndex, nextRowSeats.length - 1)] ?? null;
  } else if (event.key === "Home") {
    target = rowSeats[0];
  } else if (event.key === "End") {
    target = rowSeats[rowSeats.length - 1];
  } else {
    return;
  }

  event.preventDefault();
  target?.focus();
}

function renderVenue() {
  let totalSeats = 0;

  for (const section of venue.sections) {
    const sectionElement = document.createElement("section");
    sectionElement.className = "seat-section";
    sectionElement.dataset.category = section.category;
    sectionElement.style.gridColumn = String(section.column);
    sectionElement.style.gridRow = String(section.gridRow);

    const heading = document.createElement("h3");
    heading.className = "section-title";
    heading.textContent = section.name;
    sectionElement.append(heading);

    for (let rowIndex = 0; rowIndex < section.rows; rowIndex += 1) {
      const row = document.createElement("div");
      row.className = "seat-row";
      row.setAttribute("role", "group");
      row.setAttribute("aria-label", `${section.name}, row ${rowLabel(rowIndex)}`);

      const label = document.createElement("span");
      label.className = "row-label";
      label.textContent = rowLabel(rowIndex);
      row.append(label);

      const rowSeats = document.createElement("div");
      rowSeats.className = "row-seats";

      for (let seatIndex = 0; seatIndex < section.seatsPerRow; seatIndex += 1) {
        rowSeats.append(createSeat(section, rowIndex, seatIndex));
        totalSeats += 1;
      }

      row.append(rowSeats);
      sectionElement.append(row);
    }

    seatingArea.append(sectionElement);

    const chip = document.createElement("span");
    chip.className = "price-chip";
    const mark = document.createElement("i");
    mark.className = `category-mark ${section.category}`;
    mark.setAttribute("aria-hidden", "true");
    const name = document.createElement("span");
    name.textContent = section.name;
    const price = document.createElement("strong");
    price.textContent = formatPrice(section.price);
    chip.append(mark, name, price);
    sectionPrices.append(chip);
  }

  seatCount.textContent = `${totalSeats} seats · ${venue.sections.length} sections`;
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function inspectSeat(seatId) {
  const seat = getSeatData(seatId);
  if (!seat) {
    return;
  }

  if (inspectedSeatId) {
    updateSeatElement(inspectedSeatId);
  }
  inspectedSeatId = seatId;
  updateSeatElement(seatId);

  selectionEmpty.hidden = true;
  selectionDetails.hidden = false;
  detailSection.textContent = seat.section.name;
  detailSeat.textContent = `Row ${seat.row} · Seat ${seat.number}`;
  detailPrice.textContent = formatPrice(seat.section.price);
  detailStatus.textContent = statusLabel(seat.status);
  detailStatus.className = seat.status === "unavailable"
    ? "status-unavailable"
    : seat.status === "in-cart" ? "status-in-cart" : "";
  addButton.disabled = seat.status !== "available";

  if (seat.status === "unavailable") {
    selectionHint.textContent = "This seat is unavailable and cannot be added to your cart.";
  } else if (seat.status === "in-cart") {
    selectionHint.textContent = "This seat is already in your cart. Remove it below to make it available again.";
  } else {
    selectionHint.textContent = "No ticket is reserved until it is added to your cart.";
  }

  liveMessage.textContent = `${seat.section.name}, row ${seat.row}, seat ${seat.number}, ${formatPrice(seat.section.price)}, ${statusLabel(seat.status)}.`;
}

function statusLabel(status) {
  if (status === "in-cart") {
    return "In your cart";
  }
  return status === "unavailable" ? "Unavailable" : "Available";
}

function updateSeatElement(seatId) {
  const seat = seatsById.get(seatId);
  if (!seat) {
    return;
  }

  const status = getSeatStatus(seatId);
  const isInspected = inspectedSeatId === seatId;
  seat.element.className = `seat ${status}${isInspected ? " selected" : ""}`;
  seat.element.dataset.status = status;
  seat.element.setAttribute("aria-pressed", String(isInspected));
  seat.element.setAttribute(
    "aria-label",
    `${seat.section.name}, row ${seat.row}, seat ${seat.number}, ${formatPrice(seat.section.price)}, ${statusLabel(status)}`,
  );
  seat.element.title = `${seat.section.name} · Row ${seat.row}, seat ${seat.number} · ${formatPrice(seat.section.price)} · ${statusLabel(status)}`;
}

function addInspectedSeat() {
  if (!inspectedSeatId) {
    return;
  }
  const seat = getSeatData(inspectedSeatId);
  if (!seat || seat.status !== "available") {
    return;
  }

  cart.add(seat.id);
  persistCart();
  renderCart();
  updateSeatElement(seat.id);
  inspectSeat(seat.id);
  liveMessage.textContent = `Row ${seat.row}, seat ${seat.number} added to your cart.`;
}

function removeTicket(seatId) {
  const seat = getSeatData(seatId);
  if (!seat || !cart.delete(seatId)) {
    return;
  }

  persistCart();
  renderCart();
  updateSeatElement(seatId);
  if (inspectedSeatId === seatId) {
    inspectSeat(seatId);
  }
  liveMessage.textContent = `Row ${seat.row}, seat ${seat.number} removed from your cart.`;
}

function renderCart() {
  cartList.replaceChildren();
  let total = 0;

  for (const seatId of cart) {
    const seat = getSeatData(seatId);
    if (!seat) {
      continue;
    }
    total += seat.section.price;

    const item = document.createElement("li");
    item.className = "cart-item";

    const info = document.createElement("div");
    info.className = "cart-item-info";
    const seatLabel = document.createElement("span");
    seatLabel.className = "cart-item-seat";
    seatLabel.textContent = `Row ${seat.row} · Seat ${seat.number}`;
    const sectionLabel = document.createElement("span");
    sectionLabel.className = "cart-item-section";
    sectionLabel.textContent = seat.section.name;
    info.append(seatLabel, sectionLabel);

    const actions = document.createElement("div");
    actions.className = "cart-item-actions";
    const price = document.createElement("span");
    price.className = "cart-item-price";
    price.textContent = formatPrice(seat.section.price);
    const removeButton = document.createElement("button");
    removeButton.className = "remove-ticket";
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", `Remove ${seat.section.name}, row ${seat.row}, seat ${seat.number}`);
    removeButton.textContent = "×";
    removeButton.addEventListener("click", () => removeTicket(seat.id));
    actions.append(price, removeButton);

    item.append(info, actions);
    cartList.append(item);
  }

  const count = cart.size;
  cartCount.textContent = String(count);
  headerCartCount.textContent = String(count);
  cartTotal.textContent = formatPrice(total);
  cartEmpty.hidden = count > 0;
  cartList.hidden = count === 0;
  cartTotal.closest(".cart-total").hidden = false;

  for (const seatId of cart) {
    updateSeatElement(seatId);
  }
}

function loadCart() {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return [];
    }
    const value = JSON.parse(stored);
    if (!Array.isArray(value)) {
      throw new TypeError("Saved cart data is not a list.");
    }
    return [...new Set(value.filter((seatId) => typeof seatId === "string"))];
  } catch (error) {
    console.warn("The saved ticket cart could not be read.", error);
    showStorageNotice("Your saved cart could not be read. You can still select seats for this visit.");
    return [];
  }
}

function persistCart() {
  try {
    localStorage.setItem(storageKey, JSON.stringify([...cart]));
    storageNotice.hidden = true;
  } catch (error) {
    console.warn("The ticket cart could not be saved.", error);
    showStorageNotice("Your browser could not save the cart. Tickets will remain selected until this page is closed.");
  }
}

function showStorageNotice(message) {
  storageNotice.textContent = message;
  storageNotice.hidden = false;
}

function restoreCart() {
  for (const seatId of [...cart]) {
    if (!seatsById.has(seatId) || venue.unavailableSeats.has(seatId)) {
      cart.delete(seatId);
    }
  }
  renderCart();
  if (cart.size > 0) {
    liveMessage.textContent = `${cart.size} saved ${cart.size === 1 ? "ticket has" : "tickets have"} been restored from your last visit.`;
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateMapTransform() {
  const maxX = Math.max(0, (map.offsetWidth * mapScale - viewport.clientWidth) / 2 + 18);
  const maxY = Math.max(0, (map.offsetHeight * mapScale - viewport.clientHeight) / 2 + 18);
  mapX = clamp(mapX, -maxX, maxX);
  mapY = clamp(mapY, -maxY, maxY);
  map.style.transform = `translate(-50%, -50%) translate(${mapX}px, ${mapY}px) scale(${mapScale})`;
  zoomLevel.textContent = `${Math.round(mapScale * 100)}%`;
  zoomInButton.disabled = mapScale >= 1.6;
  zoomOutButton.disabled = mapScale <= 0.8;
}

function zoomMap(amount) {
  mapScale = clamp(Math.round((mapScale + amount) * 10) / 10, 0.8, 1.6);
  updateMapTransform();
}

function panMap(direction) {
  const distance = 55;
  if (direction === "up") mapY += distance;
  if (direction === "down") mapY -= distance;
  if (direction === "left") mapX += distance;
  if (direction === "right") mapX -= distance;
  updateMapTransform();
}

function resetMap() {
  mapScale = 1;
  mapX = 0;
  mapY = 0;
  updateMapTransform();
}

function startMapDrag(event) {
  if (event.pointerType !== "mouse" || event.button !== 0 || event.target.closest("button")) {
    return;
  }
  dragState = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, mapX, mapY, moved: false };
  viewport.classList.add("is-dragging");
  viewport.setPointerCapture(event.pointerId);
}

function moveMapDrag(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) {
    return;
  }
  const deltaX = event.clientX - dragState.startX;
  const deltaY = event.clientY - dragState.startY;
  if (Math.abs(deltaX) + Math.abs(deltaY) > 3) {
    dragState.moved = true;
  }
  mapX = dragState.mapX + deltaX;
  mapY = dragState.mapY + deltaY;
  updateMapTransform();
}

function endMapDrag(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) {
    return;
  }
  if (dragState.moved) {
    suppressSeatClickUntil = Date.now() + 250;
  }
  dragState = null;
  viewport.classList.remove("is-dragging");
}

renderVenue();
restoreCart();
updateMapTransform();

addButton.addEventListener("click", addInspectedSeat);
zoomInButton.addEventListener("click", () => zoomMap(0.1));
zoomOutButton.addEventListener("click", () => zoomMap(-0.1));
resetButton.addEventListener("click", resetMap);
document.querySelectorAll("[data-pan]").forEach((button) => {
  button.addEventListener("click", () => panMap(button.dataset.pan));
});

viewport.addEventListener("wheel", (event) => {
  event.preventDefault();
  zoomMap(event.deltaY < 0 ? 0.1 : -0.1);
}, { passive: false });
viewport.addEventListener("pointerdown", startMapDrag);
viewport.addEventListener("pointermove", moveMapDrag);
viewport.addEventListener("pointerup", endMapDrag);
viewport.addEventListener("pointercancel", endMapDrag);
window.addEventListener("resize", updateMapTransform);
