// QueueController module in Motoko
import Result "mo:base/Result";
import Text "mo:base/Text";
import HashMap "mo:base/HashMap";

import Queue "../models/Queue";
import Session "../models/Session";
import QueueService "../services/QueueService";

module {
  // Define error types
  public type Error = {
    #NotFound : Text;
    #InvalidInput : Text;
    #InternalError : Text;
  };
  
  // Define response types
  public type QueueResponse = {
    queue : Queue.Queue;
  };

  // Function to get the current queue for a doctor
  public func getCurrentQueue(
    doctorId : Text,
    queues : HashMap.HashMap<Text, Queue.Queue>,
    sessions : HashMap.HashMap<Text, Session.Session>
  ) : Result.Result<QueueResponse, Error> {
    // Validate doctor ID
    if (Text.size(doctorId) == 0) {
      return #err(#InvalidInput("Invalid doctor ID"));
    };

    // Get current queue from the service
    switch (QueueService.getCurrentQueue(queues, sessions, doctorId)) {
      case (#ok(queue)) {
        #ok({ queue = queue })
      };
      case (#err(error)) {
        switch (error) {
          case (#QueueNotFound(msg)) {
            #err(#NotFound(msg))
          };
          case (#InvalidDoctorID(msg)) {
            #err(#InvalidInput(msg))
          };
          case (_) {
            #err(#InternalError("Failed to get current queue"))
          };
        }
      };
    }
  };
}
