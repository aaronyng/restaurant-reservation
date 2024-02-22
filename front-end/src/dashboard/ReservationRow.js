import React from "react";
import { Link } from "react-router-dom";
import { updateReservationStatus } from "../utils/api";


// function to display an individual 'ReservationRow' with data (columns) shown below
export default function ReservationRow({ reservation, loadDashboard }) {
 
  // if there is no reservation passed or status = finished, return null
  if (!reservation || reservation.status === "finished") return null;

  // handles if the user wants to cancel a reservation
  function handleCancel() {
    // updates reservation status if user confirms
    if (
      window.confirm(
        "Are you sure you want to cancel your reservation?"
      )
    ) {
      const abortController = new AbortController();

      updateReservationStatus(
        reservation.reservation_id,
        "cancelled",
        abortController.status
      ).then(() => window.location.reload())

      return () => abortController.abort();
    }
  } 


  /** displays a single reservations for given day
   *  each single reservation is mapped in 'reservationsJSX()' in 'Dashboard'
   *  create a list of reservations 
   */
  return (
    <tr style={{fontFamily: "Sans-serif"}}>
      <th scope="row" className="text-white">{reservation.reservation_id}</th>
      <td className="text-center text-white">{reservation.first_name}</td>
      <td className="text-center text-white">{reservation.last_name}</td>
      <td className="text-center text-white">{reservation.mobile_number}</td>
      <td className="text-center text-white">{reservation.reservation_date.substr(0, 10)}</td>
      <td className="text-center text-white">{reservation.reservation_time.substr(0, 5)}</td>
      <td className="text-center text-white">{reservation.people}</td>
      <td className="text-center text-white" data-reservation-id-status={reservation.reservation_id}>
        {reservation.status}
      </td>

      {reservation.status === "booked" && (
        <>
          <td className="text-center">
            <Link to={`/reservations/${reservation.reservation_id}/edit`}>
              <button className="btn btn-primary btn-sm btn-outline-light" type="button">
                Edit
              </button>
            </Link>
          </td>

          <td className="text-center">
            <button
              className="btn btn-danger btn-sm btn-outline-light"
              data-reservation-id-cancel={reservation.reservation_id}
              onClick={handleCancel}
            >
              Cancel
            </button>
          </td>

          <td className="text-center">
            <Link to={`/reservations/${reservation.reservation_id}/seat`}>
              <button className="btn btn-sm btn-outline-light" type="button">
                Seat
              </button>
            </Link>
          </td>
        </>
      )}
    </tr>
  );
}