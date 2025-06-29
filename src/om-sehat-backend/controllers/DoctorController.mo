// DoctorController module in Motoko
import Result "mo:base/Result";
import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Int "mo:base/Int";

import Doctor "../models/Doctor";
import Session "../models/Session";
import Queue "../models/Queue";
import DoctorService "../services/DoctorService";
import SessionService "../services/SessionService";
import QueueService "../services/QueueService";

module {
  // Define error types
  public type Error = {
    #NotFound : Text;
    #InvalidInput : Text;
    #InternalError : Text;
  };
  
  // Define input type for doctor diagnosis
  public type DiagnosisInput = {
    diagnosis : Text;
  };
  
  // Define response types
  public type DoctorDetailsResponse = {
    doctor : Doctor.Doctor;
    appointmentCountAllTime : Int;
    appointmentCountDaily : Int;
    currentQueue : ?Queue.Queue;
  };

  // Function to handle doctor diagnosis
  public func doctorDiagnose(
    sessionId : Text,
    input : DiagnosisInput,
    sessions : HashMap.HashMap<Text, Session.Session>
  ) : Result.Result<Text, Error> {
    // Validate input
    if (Text.size(input.diagnosis) == 0) {
      return #err(#InvalidInput("Diagnosis cannot be empty"));
    };

    // Call the service to save the diagnosis
    switch (SessionService.doctorDiagnose(sessionId, input.diagnosis, sessions)) {
      case (#ok(_)) {
        #ok("Diagnosis saved successfully")
      };
      case (#err(error)) {
        switch (error) {
          case (#SessionNotFound(msg)) {
            #err(#NotFound(msg))
          };
          case (_) {
            #err(#InternalError("Failed to save diagnosis"))
          };
        }
      };
    }
  };

  // Function to get all doctors
  public func getAllDoctors(
    doctors : [Doctor.Doctor]
  ) : Result.Result<[Doctor.Doctor], Error> {
    let allDoctors = DoctorService.getAllDoctors(doctors);
    
    if (allDoctors.size() == 0) {
      #err(#NotFound("No doctors found"))
    } else {
      #ok(allDoctors)
    }
  };

  // Function to get doctor details
  public func getDoctorDetails(
    doctorId : Text,
    doctors : [Doctor.Doctor],
    queues : HashMap.HashMap<Text, Queue.Queue>,
    sessions : HashMap.HashMap<Text, Session.Session>
  ) : Result.Result<DoctorDetailsResponse, Error> {
    // Validate doctor ID
    if (Text.size(doctorId) == 0) {
      return #err(#InvalidInput("Invalid doctor ID"));
    };

    // Get doctor by ID
    switch (DoctorService.getDoctorByID(doctorId, doctors)) {
      case (#err(_)) {
        #err(#NotFound("Doctor not found"))
      };
      case (#ok(doctor)) {
        // Get appointment counts
        let totalAppointments = QueueService.getTotalAppointments(queues, doctorId);
        let dailyAppointments = QueueService.getDailyAppointments(queues, doctorId);
        
        // Get current queue
        let currentQueue = switch(QueueService.getCurrentQueue(queues, sessions, doctorId)) {
          case (#ok(queue)) { ?queue };
          case (#err(_)) { null };
        };
        
        // Create and return the response
        #ok({
          doctor = doctor;
          appointmentCountAllTime = totalAppointments;
          appointmentCountDaily = dailyAppointments;
          currentQueue = currentQueue;
        })
      };
    }
  };
}
