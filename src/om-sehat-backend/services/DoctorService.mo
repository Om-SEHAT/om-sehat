// DoctorService module in Motoko
import Array "mo:base/Array";
import Text "mo:base/Text";
import Result "mo:base/Result";

import Doctor "../models/Doctor";

module {
  // Define error types
  public type Error = {
    #NotFound : Text;
    #InvalidID : Text;
  };

  // GetAllDoctors function
  // Returns all doctors stored in the system
  public func getAllDoctors(doctors : [Doctor.Doctor]) : [Doctor.Doctor] {
    doctors
  };

  // GetDoctorByID function
  // Searches for a doctor by ID and returns it if found
  public func getDoctorByID(doctorID : Text, doctors : [Doctor.Doctor]) : Result.Result<Doctor.Doctor, Error> {
    switch (Array.find<Doctor.Doctor>(doctors, func(doctor : Doctor.Doctor) : Bool {
      return doctor.id == doctorID;
    })) {
      case (null) {
        #err(#NotFound("Doctor with ID " # doctorID # " not found"));
      };
      case (?doctor) {
        #ok(doctor);
      };
    };
  };
}
