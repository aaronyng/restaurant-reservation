const knex = require("../db/connection");

const tableName = "tables";


// lists all tables
function list() {
  return knex(tableName)
    .select("*");
}


// creates a new table
function create(table) {
  return knex(tableName)
    .insert(table)
    .returning("*");
}

// reads specific table based on table_id
function read(table_id) {
  return knex(tableName)
    .select("*")
    .where({ table_id: table_id })
    .first();
}

// updates specific reservation status based on reservation_id
function updateReservation(reservation_id, status) {
  return knex("reservations")
    .where({ reservation_id: reservation_id })
    .update({ status: status });
}


// reads specific reservation based on reservation_id
function readReservation(reservation_id) {
  return knex("reservations")
    .select("*")
    .where({ reservation_id: reservation_id })
    .first();
}

function occupy(table_id, reservation_id) {
  return knex(tableName)
    .where({ table_id: table_id })
    .update({ reservation_id: reservation_id, status: "occupied" });
}

function free(table_id) {
  return knex(tableName)
    .where({ table_id: table_id })
    .update({ reservation_id: null, status: "free" });
}

module.exports = {
  list,
  create,
  read,
  readReservation,
  updateReservation,
  occupy,
  free
};