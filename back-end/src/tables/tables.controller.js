const service = require("./tables.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");


// Validation Middleware //


// checks for data in the request
async function dataExists(req, res, next) {
  if (!req.body.data) {
    return next({ status: 400, message: "Body must include a data object" });
  }

  next();
}

// makes sure body has all required info
async function bodyExists(req, res, next) {
  if (!req.body.data.table_name || req.body.data.table_name === "") {
    return next({ 
      status: 400, 
      message: "'table_name' field is empty" });
  }

  if (req.body.data.table_name.length < 2) {
    return next({
      status: 400,
      message: "'table_name' field requires at least 2 characters",
    });
  }

  if (!req.body.data.capacity || req.body.data.capacity === "") {
    return next({ 
      status: 400, 
      message: "'capacity' field is empty" });
  }

  if (typeof req.body.data.capacity !== "number") {
    return next({ 
      status: 400, 
      message: "'capacity' field must be a number" });
  }

  if (req.body.data.capacity < 1) {
    return next({
      status: 400,
      message: "'capacity' field requires at least 1",
    });
  }

  next();
}


// makes sure that a table status is not reserved before seating
async function validateSeatedTable(req, res, next) {
  if (res.locals.table.status !== "reserved") {
    return next({ 
      status: 400, 
      message: "this table is not reserved" });
  }

  next();
}


// checks if the given table_id exists
async function tableIdExists(req, res, next) {
  const { table_id } = req.params;
  const table = await service.read(table_id);

  if (!table) {
    return next({
      status: 404,
      message: `table id: ${table_id} does not exist`,
    });
  }

  res.locals.table = table;

  next();
}


// checks that the reservation_id exists
 async function reservationIdExists(req, res, next) {
  const { reservation_id } = req.body.data;

  if (!reservation_id) {
    return next({
      status: 400,
      message: `reservation_id field is required in the body`,
    });
  }

  const reservation = await service.readReservation(Number(reservation_id));

  if (!reservation) {
    return next({
      status: 404,
      message: `reservation_id: ${reservation_id} does not exist`,
    });
  }

  res.locals.reservation = reservation;

  next();
}


// checks table status and capacity are valid for the reservation
 async function validateSeat(req, res, next) {
  if (res.locals.table.status === "reserved") {
    return next({
      status: 400,
      message: "The table you selected is currently reserved",
    });
  }

  if (res.locals.reservation.status === "seated") {
    return next({
      status: 400,
      message: "The reservation you selected is already seated",
    });
  }

  if (res.locals.table.capacity < res.locals.reservation.people) {
    return next({
      status: 400,
      message: `The table you selected does not have enough capacity to seat ${res.locals.reservation.people} people`,
    });
  }

  next();
}


// Handlers //


// lists all tables
async function list(req, res) {
  const result = await service.list();

  res.json({ data: result });
}


// creates table.
async function create(req, res) {
  if (req.body.data.reservation_id) {
    req.body.data.status = "reserved";
    await service.updateReservation(req.body.data.reservation_id, "seated");
  } else {
    req.body.data.status = "free";
  }

  const result = await service.create(req.body.data);

  res.status(201).json({ data: result[0] });
}


// updates table when it is seated
async function update(req, res) {
  await service.reserved(
    res.locals.table.table_id,
    res.locals.reservation.reservation_id
  );
  await service.updateReservation(
    res.locals.reservation.reservation_id,
    "seated"
  );

  res.status(200).json({ data: { status: "seated" } });
}


// customer finishes a table
async function destroy(req, res) {
  await service.updateReservation(
    res.locals.table.reservation_id,
    "finished"
  );
  await service.free(res.locals.table.table_id);
  res.status(200).json({ data: { status: "finished" } });
}


module.exports = {
  list: asyncErrorBoundary(list),
  create: [
    asyncErrorBoundary(dataExists),
    asyncErrorBoundary(bodyExists),
    asyncErrorBoundary(create),
  ],
  update: [
    asyncErrorBoundary(dataExists),
    asyncErrorBoundary(tableIdExists),
    asyncErrorBoundary(reservationIdExists),
    asyncErrorBoundary(validateSeat),
    asyncErrorBoundary(update),
  ],
  destroy: [
    asyncErrorBoundary(tableIdExists),
    asyncErrorBoundary(validateSeatedTable),
    asyncErrorBoundary(destroy),
  ],
};