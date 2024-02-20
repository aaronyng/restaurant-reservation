const knex = require("../db/connection");

const tableName = "reservations";


// lists reservations with given date/mobile number.
function list(date, mobile_number) {
  if (date) {
    return knex(tableName)
      .select("*")
      .where({ reservation_date: date })
      .orderBy("reservation_time", "asc");
  }

  if (mobile_number) {
    return knex(tableName)
      .select("*")
      .where("mobile_number", "like", `${mobile_number}%`);
  }

  return knex(tableName)
    .select("*");
}


// creates new reservation
function create(reservation) {
  return knex(tableName)
    .insert(reservation)
    .returning("*");
}

// reads reservation data with given reservation_id.
function read(reservation_id) {
  return knex(tableName)
    .select("*")
    .where({ reservation_id: reservation_id })
    .first();
}

// updates reservation with given reservation_id.
function update(reservation_id, status) {
  return knex(tableName)
    .where({ reservation_id: reservation_id })
    .update({ status: status });
}

// edits reservation with given reservation_id.
function edit(reservation_id, reservation) {
  return knex(tableName)
    .where({ reservation_id: reservation_id })
    .update({ ...reservation })
    .returning("*");
}


module.exports = {
  list,
  create,
  read,
  update,
  edit,
};