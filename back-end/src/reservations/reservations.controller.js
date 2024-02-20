const service = require("./reservations.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");


// Validation Middleware //


// checks for data in the request
async function dataExists(req, res, next) {
  if (!req.body.data) {
    return next({ status: 400, message: "Body must include a data object" });
  }
  next();
}


// checks if reservation exists by searching for the id
async function reservationIdExists(req, res, next) {
  const { reservation_id } = req.params;
  const reservation = await service.read(Number(reservation_id));
  if (!reservation) {
    return next({
      status: 404,
      message: `reservation id ${reservation_id} does not exist`,
    });
  }
  res.locals.reservation = reservation;
  next();
}


// checks if all required fields are provided
async function bodyExists(req, res, next) {
  const requiredFields = [
    "first_name",
    "last_name",
    "mobile_number",
    "reservation_date",
    "reservation_time",
    "people",
  ];

  for (const field of requiredFields) {
    if (!req.body.data.hasOwnProperty(field) || req.body.data[field] === "") {
      return next({ 
        status: 400, 
        message: `Field required: '${field}'` });
    }
  }

  if (Number.isNaN(
    Date.parse(`${req.body.data.reservation_date} ${req.body.data.reservation_time}`))) {
    return next({
      status: 400,
      message:
        "'reservation_date' or 'reservation_time' field is not in correct format",
    });
  }

  if (typeof req.body.data.people !== "number") {
    return next({ 
      status: 400, 
      message: "'people' field must be a number" });
  }

  if (req.body.data.people < 1) {
    return next({ 
      status: 400, 
      message: "'people' field must have capacity of least 1 person" });
  }

  if (req.body.data.status !== "booked") {
    return next({
      status: 400,
      message: `'status' field cannot be ${req.body.data.status}`,
    });
  }

  next();
}

/* checks if reservation is valid:
  * it's in the future
  * restaurant is open
  * during restaurant hours
*/
async function validateDate(req, res, next) {
  const reserveDate = new Date(
    `${req.body.data.reservation_date}T${req.body.data.reservation_time}:00.000`
  );
  const todaysDate = new Date();

  if (reserveDate.getDay() === 2) {
    return next({
      status: 400,
      message: "'reservation_date' field: restaurant is closed on Tuesdays",
    });
  }

  if (reserveDate < todaysDate) {
    return next({
      status: 400,
      message:
        "'reservation_date' and 'reservation_time' field must be in the future",
    });
  }

  if (
    reserveDate.getHours() < 10 ||
    (reserveDate.getHours() === 10 && reserveDate.getMinutes() < 30)
  ) {
    return next({
      status: 400,
      message: "'reservation_time' field: restaurant does not open until 10:30 AM",
    });
  }

  if (
    reserveDate.getHours() > 22 ||
    (reserveDate.getHours() === 22 && reserveDate.getMinutes() >= 30)
  ) {
    return next({
      status: 400,
      message: "'reservation_time' field: restaurant is closed after 10:30 PM",
    });
  }

  if (
    reserveDate.getHours() > 21 ||
    (reserveDate.getHours() === 21 && reserveDate.getMinutes() > 30)
  ) {
    return next({
      status: 400,
      message:
        "'reservation_time' field: reservation must be made at least an hour before 10:30 PM",
    });
  }

  next();
}


// checks if reservation has a valid status
async function validateUpdateBody(req, res, next) {
  if (!req.body.data.status) {
    return next({ status: 400, message: "body must include a status field" });
  }

  if (
    req.body.data.status !== "booked" &&
    req.body.data.status !== "seated" &&
    req.body.data.status !== "finished" &&
    req.body.data.status !== "cancelled"
  ) {
    return next({
      status: 400,
      message: `'status' field cannot be ${req.body.data.status}`,
    });
  }

  if (res.locals.reservation.status === "finished") {
    return next({
      status: 400,
      message: `a finished reservation cannot be updated`,
    });
  }
  next();
}


// Handlers //


// lists reservations for a given date with/without a given mobile number
async function list(req, res) {
  const date = req.query.date;
  const mobile_number = req.query.mobile_number;
  const reservations = await service.list(date, mobile_number);
  const result = reservations.filter(
    (reservation) => reservation.status !== "finished"
  );
  res.json({ data: result });
}


// retrieves a specific reservation based on reservation_id
async function read(req, res) {
  res.status(200).json({ data: res.locals.reservation });
}


// creates new reservation and returns newly created reservation data
async function create(req, res) {
  req.body.data.status = "booked";
  const result = await service.create(req.body.data);
  res.status(201).json({ data: result[0] });
}

/** updates a valid reservation */
async function update(req, res) {
  await service.update(
    res.locals.reservation.reservation_id,
    req.body.data.status
  );

  res.status(200).json({ data: { status: req.body.data.status } });
}

// edits a valid reservation
async function edit(req, res) {
  const result = await service.edit(
    res.locals.reservation.reservation_id,
    req.body.data
  );
  res.status(200).json({ data: result[0] });
}


module.exports = {
  list: asyncErrorBoundary(list),
  read: [
    asyncErrorBoundary(reservationIdExists), 
    asyncErrorBoundary(read)
  ],
  create: [
    asyncErrorBoundary(dataExists),
    asyncErrorBoundary(bodyExists),
    asyncErrorBoundary(validateDate),
    asyncErrorBoundary(create),
  ],
  update: [
    asyncErrorBoundary(dataExists),
    asyncErrorBoundary(reservationIdExists),
    asyncErrorBoundary(validateUpdateBody),
    asyncErrorBoundary(update),
  ],
  edit: [
    asyncErrorBoundary(dataExists),
    asyncErrorBoundary(reservationIdExists),
    asyncErrorBoundary(bodyExists),
    asyncErrorBoundary(validateDate),
    asyncErrorBoundary(edit),
  ]
};
